# Fishies

A retro pixel-art field guide that follows sea creatures from their habitats through their life stories, then helps you find aquariums, restaurants and seafood shops near a location you choose.

Choose from a curated catalogue of 18 fish, shellfish, cephalopods and deep-sea creatures. Explore an interactive globe, illustrated lifecycle chapters and species-appropriate routes. The creature catalogue is prepared in advance; venue and recipe discovery runs against the live web when requested.

## Run locally

Use Node.js 20.9 or newer and npm.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The catalogue, facts, lifecycle and globe work without a key. For live discovery, select **Add API key** and enter your own TinyFish key with access to Search, Fetch and Agent.

The app keeps your key only in memory in the current tab. It survives navigation within Fishies but clears on refresh or closing the tab. **Your API key → Remove key** clears it immediately. Each live request sends it in a header over HTTPS to Fishies’ server, which forwards it to the appropriate TinyFish endpoint without saving it. Requests use the visitor’s TinyFish account and allowance. Do not use HTTP for a public deployment.

There is no shared server key or environment-variable fallback. Do not add `TINYFISH_API_KEY` to Vercel; a visitor must supply a key even if that variable exists in a local environment. API keys are never sent in URL parameters, response bodies or application logs, and are not put in browser storage or cookies. Hosting infrastructure still processes the request headers, so this is not a direct browser-to-TinyFish connection.

Other useful commands:

```sh
npm run check
npm run test:keys
npm run build
npm run start
```

`npm run start` serves the production build after `npm run build` succeeds. These instructions describe the source project; they do not confirm a public deployment.

## What to try

- Choose a clownfish and find places to see it near London.
- Choose a salmon, lobster or squid and search for restaurants or fishmongers near another city.
- Open a result’s agent check to inspect the venue’s own website in more detail.
- Find cooking inspiration through the recipe search.
- Choose the dumbo octopus to explore a creature whose story stays in the wild.
- Visit `/studio` to see the illustrated asset collection.

The geographic markers show broad, illustrative habitat regions. They are not precise species distribution boundaries. The cooking art depicts example dishes, not a restaurant’s actual food or a complete preparation guide.

## How TinyFish is used

Three endpoints contribute to the discovery experience:

| Endpoint | Its job in Fishies |
| --- | --- |
| **Search** | Finds public aquarium, restaurant, shop and recipe pages using the selected creature, route and location. |
| **Fetch** | Reads discovered pages and extracts relevant text. Results distinguish pages that were read from search leads that could not be checked. |
| **Agent** | Opens a selected venue website for a read-only investigation of the offering, species evidence, prices and visit details. Streams progress and returns its findings. |

The app labels source evidence and time of checking. A menu mention is not a booking or confirmation of current stock. Common menu names do not necessarily identify the exact scientific species. Agent checks do not log in, make purchases or submit forms.

API handlers live in `app/api/`. Each handler requires the visitor’s key before contacting TinyFish. Short-lived result tokens are bound to that key, so changing or removing it clears previous results. A missing or malformed key returns HTTP 401 without an upstream request. The API’s simple in-memory rate limiter is intended for the demo; a larger public service would need persistent, shared limits.

## Artwork and creature sources

The art collection was created using built-in ImageGen, with a shared marine field-guide style: navy ink, ocean teal, sea-glass greens, parchment and coral highlights. Selected artwork includes **15 illustrated scenes and 138 sprite cells**, chosen from **70 generated image variants**. Sprites cover creatures, lifecycle stages, aquarium and navigation props, cookware, ingredients and plated dishes. Website files are in `public/art/`; the separate asset delivery includes the alternatives, prompts, cell maps and selection notes.

Creature entries carry their own natural-history source links in `lib/catalogue.ts`. References include:

- [NOAA Fisheries species directory](https://www.fisheries.noaa.gov/species-directory)
- [Aquarium of the Pacific Online Learning Center](https://www.aquariumofpacific.org/onlinelearningcenter)
- [Monterey Bay Aquarium animals](https://www.montereybayaquarium.org/animals)
- [Marine Life Information Network](https://www.marlin.ac.uk/species)
- [The Wildlife Trusts wildlife explorer](https://www.wildlifetrusts.org/wildlife-explorer)
- [Natural History Museum: octopuses](https://www.nhm.ac.uk/discover/octopuses-keep-surprising-us-here-are-eight-examples-how.html)

The individual entry links are the relevant starting point for checking or extending a species story. These are educational illustrations and summaries, not a complete biological database. Live result cards link to the pages returned by TinyFish.

## Creature requests

The small “Request a creature” form is a demo feature. In local development, accepted suggestions are appended to `data/requests.jsonl`, which should remain ignored by Git.

On Vercel, the server does not try to write to the application filesystem. It directs the form to save the suggestion in the visitor’s `localStorage` instead. The confirmation says: **“Saved in this browser. Requests aren’t sent to the creator yet.”** Browser storage holds the latest 100 suggestions and is removed if the visitor clears the site’s saved data. There is no email delivery or shared request database.

## Project map

- `app/page.tsx` — field guide, catalogue and discovery interface.
- `app/globe.tsx` — interactive globe using D3 Geo and World Atlas geographic data.
- `app/studio/page.tsx` — artwork gallery.
- `app/request-creature.tsx` — creature suggestion form.
- `lib/catalogue.ts` — curated species stories, route availability and sources.
- `app/tinyfish-key.tsx` — in-memory visitor key and masked key settings.
- `lib/tinyfish.ts` — request-only TinyFish credentials and server-side helpers.
- `scripts/test-api-keys.cjs` — credential isolation and no-fallback regression tests.
- `public/art/` — selected generated artwork.

Built with Next.js, React, Motion, D3 Geo, TopoJSON and Lucide icons.
