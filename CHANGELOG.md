# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Unread dots on top bar icons never updated: the script hooked into the header before Nextcloud had mounted the waffle menu, so core replaced the `OC.setNavigationCounter` override again. The script now waits for core's `DOMContentLoaded` listener on `window`.
- Navigation refreshes from other apps (for example after enabling an app) could be missed for the same reason. A missing event bus is now reported instead of silently ignored.
- The waffle button was hidden for users who still had an "App store" tile in it. The app now knows about the "More apps" and "App store" tiles that Nextcloud adds itself.
- Purely numeric navigation entry ids were stored as numbers and then treated as unassigned.
- Dropping an app outside the two lists on the settings page moved it without marking the settings as changed.
- The first paint could show one icon too many on narrow screens, before the waffle button had taken its space.
- Sending a non-array value for `top` or `waffle` to the settings endpoint answered with a server error instead of ignoring it.

### Changed

- The supported Nextcloud range is now 34 to 35. The app depends on core internals, so each new major is checked before the maximum is raised.

### Added

- `.gitignore`, a lint workflow for GitHub Actions and this changelog.

## [1.0.0] - 2026-09-24

### Added

- Initial release for Nextcloud 34 to 36: app icons in the header, admin settings to arrange apps between the top bar and the waffle menu, overflow into the waffle menu on narrow screens, German translations.

[Unreleased]: https://github.com/moregeo-it/nextcloud-classic-menu/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/moregeo-it/nextcloud-classic-menu/releases/tag/v1.0.0
