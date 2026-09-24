# Classic App Menu

Nextcloud 34 replaced the app icons in the header with a waffle menu. This app brings the icons back.

Admins decide for all users:

- which apps are shown as icons in the top bar,
- which apps go into the waffle menu,
- the order in both places.

Out of the box every app goes into the top bar, like before Nextcloud 34.

## Installation

No build step is needed.

1. Copy this folder to `custom_apps/classic_appmenu` (or `apps/`) on your Nextcloud server.
2. Enable the app: `occ app:enable classic_appmenu`
3. Configure it under *Administration settings → Theming → Header app icons*.

Supports Nextcloud 34 and hopefully 35.

## Settings

- **Top bar / Waffle menu**: drag apps between the two lists and into the order you want. The ↑ ↓ ⇄ buttons do the same from the keyboard. This order replaces each user's personal app order.
- **Apps not listed above**: where newly installed apps go, and apps restricted to groups you aren't in. Those apps don't appear in your lists, because the settings page can only show apps your own account can see. Saving assigns every app in the two lists explicitly, so this setting only affects apps that are not in the lists at that time. *Reset to default* clears all assignments.
- **Position of the waffle menu**: before or after the icons.
- **Also list the top bar apps in the waffle menu**: turns the waffle into a full app list.

The config is stored as JSON in the app config key `classic_appmenu/layout`, so it can also be set with occ:

```sh
occ config:app:set classic_appmenu layout --value='{"top":["dashboard","files","calendar"],"waffle":["deck"],"unassigned":"top","wafflePosition":"end","waffleShowsAll":false}'
```

## How it works

Nextcloud's waffle menu (`core/src/components/AppMenu.vue`) reads its entries from the initial state `core/apps` when it mounts on `DOMContentLoaded`. It then listens for the `nextcloud:app-menu.refresh` event.

On every logged-in page, this app loads a small script that runs before the waffle mounts. The script:

1. Splits the user's navigation entries into top bar and waffle entries, based on the config.
2. Draws the top bar icons next to the waffle button. The markup and styles are adapted from the Nextcloud 33 app menu, including the active indicator, labels on hover, and unread dots.
3. Rewrites the `core/apps` initial state so the waffle shows only its own entries.
4. Moves icons that don't fit on narrow screens into the waffle menu.
5. Re-splits the list when another app sends a full list via `nextcloud:app-menu.refresh`, for example after an app is enabled.
6. Hides the waffle button when the waffle has nothing to show. The waffle adds a tile of its own for admins ("More apps") and, if the app store link is enabled, for other users ("App store"), so it stays visible for them.

Core files are not patched.

## Limitations

- The script depends on core internals: the `#header-start__appmenu` mount point, the `core/apps` and `core/appStoreLinkShown` initial states, `OC.setNavigationCounter`, and the refresh event. A future Nextcloud release might change them.
- When every app sits in the top bar, users without an "App store" tile see no waffle button at all. Admins always keep it for the "More apps" tile.
- The "current app" name next to the waffle button only appears when the active app is a waffle entry. That is core behaviour, left unchanged.
