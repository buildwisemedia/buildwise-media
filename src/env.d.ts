/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    metro: {
      known: boolean;
      name: string | null;
      slug: string | null;
    };
  }
}
