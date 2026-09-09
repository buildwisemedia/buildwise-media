#!/usr/bin/env python3
"""Post one information-only board note from an enrolled Claude cloud task.

No dependencies, credential lookup, redirects, URL overrides or write retries.
The approved Claude credential proxy attaches the board-only header. The
agent never receives the token. Reads continue through the task's existing Supabase connector.
"""
import argparse
import json
import os
import re
import secrets
import sys
import time
import urllib.error
import urllib.request

ENDPOINT = 'https://bwm-command-api.robert-ba0.workers.dev/agent-messages/write'
LABEL = re.compile(r'[A-Za-z0-9][A-Za-z0-9_.:@/-]{0,127}\Z')
ID = re.compile(r'[0-7][0-9A-HJKMNP-TV-Z]{25}\Z')


def identifier():
    number = (int(time.time() * 1000) << 80) | secrets.randbits(80)
    alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
    return ''.join(alphabet[(number >> (5 * i)) & 31] for i in reversed(range(26)))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def send(note):
    req = urllib.request.Request(ENDPOINT, method='POST',
        data=json.dumps(note, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'User-Agent': 'BWM-Agent-Message-Cloud/1.0'})
    opener = urllib.request.build_opener(NoRedirect())
    with opener.open(req, timeout=35) as response:
        raw = response.read(8193)
        if len(raw) > 8192:
            raise ValueError('Oversized receipt')
        return json.loads(raw)


def post(args, environ, stdin, transport=send):
    if environ.get('CLAUDE_CODE_REMOTE') != 'true' or environ.get('BWM_AGENT_MESSAGE_DISABLED') == '1':
        raise ValueError('Cloud board writer is disabled for this runtime')
    if environ.get('BWM_AGENT_MESSAGE_CLOUD_WRITER') != 'proxy':
        raise ValueError('Missing approved cloud writer enrollment (BWM_AGENT_MESSAGE_CLOUD_WRITER=proxy)')
    note = {key: getattr(args, key) for key in ('project', 'task', 'sender', 'session_id')}
    if not all(isinstance(v, str) and LABEL.fullmatch(v) for v in note.values()):
        raise ValueError('Use explicit labels and your actual runtime session ID')
    body = stdin.read(8001) if args.body == '-' else args.body
    if not body.strip() or len(body) > 8000 or '\x00' in body or any(0xD800 <= ord(c) <= 0xDFFF for c in body):
        raise ValueError('Body must contain 1–8000 characters and no NUL or lone surrogate')
    if bool(args.thread) != bool(args.reply_to):
        raise ValueError('Replies require both --thread and --reply-to')
    if args.thread:
        if not LABEL.fullmatch(args.thread) or not ID.fullmatch(args.reply_to):
            raise ValueError('Invalid reply labels')
        note.update(thread=args.thread, reply_to=args.reply_to)
    event_id = args.event_id or identifier()
    if not ID.fullmatch(event_id):
        raise ValueError('Invalid event ID')
    note.update(event_id=event_id, body=body, test_only=args.test_only)
    try:
        receipt = transport(note)
        if (not isinstance(receipt, dict) or receipt.get('event_id') != event_id or
            receipt.get('thread_id') != (args.thread or event_id) or receipt.get('verified') is not True or
            type(receipt.get('inserted')) is not bool or receipt.get('authority') != 'information-only'):
            raise ValueError('Receipt did not verify')
    except Exception:
        # No upstream message/body/headers are included: they may contain secrets.
        return {'event_id': event_id, 'verified': False,
                'error': 'Write status unknown. Read this ID through the existing board reader before retrying.'}, 1
    return {k: receipt[k] for k in ('event_id', 'thread_id', 'verified', 'inserted', 'authority')}, 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('project', 'task', 'sender', 'session-id', 'body'):
        parser.add_argument('--' + key, required=True)
    parser.add_argument('--thread')
    parser.add_argument('--reply-to')
    parser.add_argument('--event-id', help='Only reuse after reading an uncertain prior ID; never change its note')
    parser.add_argument('--test-only', action='store_true')
    args = parser.parse_args()
    try:
        receipt, code = post(args, os.environ, sys.stdin)
    except ValueError as error:
        receipt, code = {'verified': False, 'error': str(error)}, 1
    print(json.dumps(receipt, ensure_ascii=True))
    return code


if __name__ == '__main__':
    sys.exit(main())
