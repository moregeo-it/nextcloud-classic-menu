/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Restores the app icons in the header next to the waffle menu of Nextcloud 34+.
 *
 * The waffle menu (core AppMenu.vue) reads its entries from the initial state
 * `core/apps` when it mounts on DOMContentLoaded and afterwards listens to the
 * `nextcloud:app-menu.refresh` event. This script runs before that (deferred
 * module), so it rewrites the initial state to the waffle entries only and
 * renders the top bar entries itself. Later changes are pushed via the event.
 */

const APP_ID = 'classic_appmenu'
const REFRESH_EVENT = 'nextcloud:app-menu.refresh'
// Marks refresh events emitted by this script, so they are not handled again
const MARKER = '_classicAppMenu'

const translate = (text) => (typeof window.t === 'function' ? window.t(APP_ID, text) : text)

/**
 * Same lookup as @nextcloud/initial-state, which caches parsed values in a shared map.
 */
function readState(app, key, fallback) {
	const selector = `#initial-state-${app}-${key}`
	if (window._nc_initial_state?.has(selector)) {
		return window._nc_initial_state.get(selector)
	}
	const element = document.querySelector(selector)
	if (!element) {
		return fallback
	}
	try {
		return JSON.parse(atob(element.value))
	} catch (error) {
		console.error(`[${APP_ID}] Could not parse initial state ${app}/${key}`, error)
		return fallback
	}
}

function writeState(app, key, value) {
	const selector = `#initial-state-${app}-${key}`
	const element = document.querySelector(selector)
	if (element) {
		// Escape non-ASCII like PHP's json_encode does, as the reader decodes with plain atob()
		const json = JSON.stringify(value)
			.replace(/[^ -~]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
		element.value = btoa(json)
	}
	window._nc_initial_state?.set(selector, value)
}

const config = readState(APP_ID, 'config', {
	top: [],
	waffle: [],
	unassigned: 'top',
	wafflePosition: 'end',
	waffleShowsAll: false,
})
const navigationActions = readState('core', 'navigationActions', [])

const header = document.getElementById('header')
const headerStart = header?.querySelector('.header-start')
const placeholder = document.getElementById('header-start__appmenu')

let allApps = readState('core', 'apps', [])
let topApps = []
let waffleApps = []
// Number of top bar entries that fit, the remaining ones overflow into the waffle menu
let visibleCount = 0
let menuMounted = false
let lastEmitted = null

let nav = null
let list = null

/**
 * Split the navigation entries of the current user into top bar and waffle menu.
 * Entries not mentioned in the config keep the core order (which includes the
 * personal app order of the user) and go to the configured default location.
 */
function partition() {
	const byId = new Map(allApps.map((app) => [app.id, app]))
	const pick = (ids) => (ids ?? []).map((id) => byId.get(id)).filter(Boolean)
	const assigned = new Set([...(config.top ?? []), ...(config.waffle ?? [])])
	const rest = allApps.filter((app) => !assigned.has(app.id))

	topApps = [...pick(config.top), ...(config.unassigned === 'waffle' ? [] : rest)]
	waffleApps = [...pick(config.waffle), ...(config.unassigned === 'waffle' ? rest : [])]
	visibleCount = topApps.length
}

function waffleList() {
	if (config.waffleShowsAll) {
		return [...topApps, ...waffleApps]
	}
	return [...topApps.slice(visibleCount), ...waffleApps]
}

function createEntry(app) {
	const item = document.createElement('li')
	item.className = 'classic-appmenu__entry'
	item.dataset.id = app.id
	item.classList.toggle('classic-appmenu__entry--active', !!app.active)

	const link = document.createElement('a')
	link.className = 'classic-appmenu__link'
	link.href = app.href
	link.title = app.name
	if (app.active) {
		link.setAttribute('aria-current', 'page')
	}
	if (app.target) {
		link.target = '_blank'
		link.rel = 'noopener noreferrer'
	}

	const icon = document.createElement('span')
	icon.className = 'classic-appmenu__icon'
	icon.setAttribute('role', 'img')
	const image = document.createElement('img')
	image.className = 'classic-appmenu__image'
	image.src = app.icon
	image.alt = ''
	const unread = document.createElement('span')
	unread.className = 'classic-appmenu__unread'
	icon.append(image, unread)

	const label = document.createElement('span')
	label.className = 'classic-appmenu__label'
	label.textContent = app.name

	link.append(icon, label)
	item.append(link)
	updateUnread(item, app)
	return item
}

function updateUnread(item, app) {
	const hasUnread = app.unread > 0
	item.classList.toggle('classic-appmenu__entry--unread', hasUnread)
	// The icon is only announced if it carries information, the label names the app
	const icon = item.querySelector('.classic-appmenu__icon')
	if (hasUnread) {
		icon.removeAttribute('aria-hidden')
		icon.setAttribute('aria-label', `${app.name} (${app.unread})`)
	} else {
		icon.setAttribute('aria-hidden', 'true')
		icon.removeAttribute('aria-label')
	}
}

function render() {
	list.replaceChildren(...topApps.map(createEntry))
	visibleCount = topApps.length
	layout(true)
}

/**
 * Hide the top bar entries that don't fit, they are shown in the waffle menu instead.
 */
function layout(force = false) {
	const entries = [...list.children]
	const entryWidth = parseFloat(getComputedStyle(nav).getPropertyValue('--classic-appmenu-entry-width')) || 50
	const limit = Math.min(entries.length, Math.floor(nav.clientWidth / entryWidth))
	if (!force && limit === visibleCount) {
		return
	}
	visibleCount = limit
	entries.forEach((entry, index) => {
		entry.hidden = index >= limit
	})
	updateWaffle()
}

function updateWaffle() {
	const apps = waffleList()
	const empty = apps.length === 0 && navigationActions.length === 0
	header.dataset.classicAppmenuWaffle = empty ? 'hidden' : (config.wafflePosition === 'start' ? 'start' : 'end')

	if (!menuMounted) {
		writeState('core', 'apps', apps)
		return
	}

	const signature = apps.map((app) => app.id).join('\n')
	if (signature === lastEmitted) {
		return
	}
	lastEmitted = signature
	window._nc_event_bus?.emit(REFRESH_EVENT, { apps, [MARKER]: true })
}

/**
 * Another app changed the navigation (e.g. enabled an app or changed the personal
 * app order) and sent the full list to the waffle menu, so split it up again.
 */
function onRefresh(event) {
	if (!event || event[MARKER] || !Array.isArray(event.apps)) {
		return
	}
	allApps = event.apps
	partition()
	lastEmitted = null
	// Let the waffle menu process the full list first, then replace it
	setTimeout(render, 0)
}

function afterMenuMounted() {
	menuMounted = true
	lastEmitted = null

	// Unread counters are set via the core menu, which only knows the waffle entries now
	const setCounter = window.OC?.setNavigationCounter
	if (window.OC) {
		window.OC.setNavigationCounter = (id, counter) => {
			const app = allApps.find((entry) => entry.app === id)
			if (!app) {
				return
			}
			app.unread = counter
			const item = [...list.children].find((entry) => entry.dataset.id === app.id)
			if (item) {
				updateUnread(item, app)
			}
			if (setCounter && waffleList().includes(app)) {
				setCounter(id, counter)
			}
		}
	}

	window._nc_event_bus?.subscribe(REFRESH_EVENT, onRefresh)
	updateWaffle()
	new ResizeObserver(() => layout()).observe(nav)
}

function init() {
	if (!header || !headerStart || !placeholder) {
		// Not the user layout, e.g. a public page
		return
	}

	nav = document.createElement('nav')
	nav.className = 'classic-appmenu'
	nav.setAttribute('aria-label', translate('Apps'))
	list = document.createElement('ul')
	list.className = 'classic-appmenu__list'
	nav.append(list)
	// Core replaces the placeholder with the waffle menu, the order is set via CSS
	placeholder.after(nav)

	partition()
	render()

	if (document.readyState === 'complete') {
		afterMenuMounted()
	} else {
		// Core mounts the waffle menu on DOMContentLoaded, its listener was registered first
		document.addEventListener('DOMContentLoaded', afterMenuMounted, { once: true })
	}
}

init()
