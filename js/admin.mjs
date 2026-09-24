/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Admin settings: arrange the apps in the top bar and the waffle menu.
 */

const APP_ID = 'classic_appmenu'

const translate = (text, vars) => (typeof window.t === 'function' ? window.t(APP_ID, text, vars) : text)

function readState(key, fallback) {
	const element = document.querySelector(`#initial-state-${APP_ID}-${key}`)
	if (!element) {
		return fallback
	}
	try {
		return JSON.parse(atob(element.value))
	} catch (error) {
		console.error(`[${APP_ID}] Could not parse initial state ${key}`, error)
		return fallback
	}
}

const defaults = readState('defaults', { top: [], waffle: [], unassigned: 'top', wafflePosition: 'end', waffleShowsAll: false })
const entries = readState('entries', [])
let config = readState('config', defaults)

const root = document.getElementById('classic-appmenu-settings')
const lists = {
	top: root.querySelector('[data-target="top"]'),
	waffle: root.querySelector('[data-target="waffle"]'),
}
const status = document.getElementById('classic-appmenu-status')

let dragged = null

function url() {
	const path = `/apps/${APP_ID}/settings`
	return window.OC?.generateUrl ? window.OC.generateUrl(path) : `/index.php${path}`
}

function requestToken() {
	return window.OC?.requestToken ?? document.head.dataset.requesttoken ?? ''
}

function setStatus(text, isError = false) {
	status.textContent = text
	status.classList.toggle('classic-appmenu-settings__status--error', isError)
}

/**
 * Same split as in the header: configured order first, the rest in core order.
 */
function partition() {
	const byId = new Map(entries.map((entry) => [entry.id, entry]))
	// Keep configured entries the admin can't see, so saving doesn't drop them
	const lookup = (id) => byId.get(id) ?? { id, name: id, icon: '', unavailable: true }
	const assigned = new Set([...config.top, ...config.waffle])
	const rest = entries.filter((entry) => !assigned.has(entry.id))
	return {
		top: [...config.top.map(lookup), ...(config.unassigned === 'waffle' ? [] : rest)],
		waffle: [...config.waffle.map(lookup), ...(config.unassigned === 'waffle' ? rest : [])],
	}
}

function button(text, label, onClick) {
	const element = document.createElement('button')
	element.type = 'button'
	element.className = 'classic-appmenu-settings__button'
	element.textContent = text
	element.title = label
	element.setAttribute('aria-label', label)
	element.addEventListener('click', onClick)
	return element
}

function createItem(entry) {
	const item = document.createElement('li')
	item.className = 'classic-appmenu-settings__item'
	item.draggable = true
	item.dataset.id = entry.id

	const handle = document.createElement('span')
	handle.className = 'classic-appmenu-settings__handle'
	handle.setAttribute('aria-hidden', 'true')
	handle.textContent = '⠿'

	const icon = document.createElement('span')
	icon.className = 'classic-appmenu-settings__icon'
	if (entry.icon) {
		icon.style.setProperty('--icon-url', `url("${entry.icon.replace(/["\\]/g, '\\$&')}")`)
	}

	const name = document.createElement('span')
	name.className = 'classic-appmenu-settings__name'
	name.textContent = entry.name
	if (entry.unavailable) {
		const hint = document.createElement('em')
		hint.textContent = ` (${translate('not available to you')})`
		name.append(hint)
	}

	const actions = document.createElement('span')
	actions.className = 'classic-appmenu-settings__item-actions'
	actions.append(
		button('↑', translate('Move {app} up', { app: entry.name }), () => move(item, -1)),
		button('↓', translate('Move {app} down', { app: entry.name }), () => move(item, 1)),
		button('⇄', translate('Move {app} to the other list', { app: entry.name }), () => switchList(item)),
	)

	item.append(handle, icon, name, actions)

	item.addEventListener('dragstart', (event) => {
		dragged = item
		item.classList.add('classic-appmenu-settings__item--dragging')
		event.dataTransfer.effectAllowed = 'move'
		event.dataTransfer.setData('text/plain', entry.id)
	})
	item.addEventListener('dragend', () => {
		item.classList.remove('classic-appmenu-settings__item--dragging')
		dragged = null
	})
	return item
}

function move(item, direction) {
	const sibling = direction < 0 ? item.previousElementSibling : item.nextElementSibling
	if (!sibling) {
		return
	}
	if (direction < 0) {
		sibling.before(item)
	} else {
		sibling.after(item)
	}
	focusButton(item, direction < 0 ? 0 : 1)
	changed()
}

function switchList(item) {
	const target = item.parentElement === lists.top ? lists.waffle : lists.top
	target.append(item)
	focusButton(item, 2)
	changed()
}

function focusButton(item, index) {
	item.querySelectorAll('.classic-appmenu-settings__button')[index]?.focus()
}

function changed() {
	setStatus(translate('Unsaved changes'))
}

/**
 * The item below the cursor position, the dragged item is inserted before it.
 */
function itemAfter(list, y) {
	const items = [...list.querySelectorAll('.classic-appmenu-settings__item:not(.classic-appmenu-settings__item--dragging)')]
	return items.find((item) => {
		const box = item.getBoundingClientRect()
		return y < box.top + box.height / 2
	}) ?? null
}

for (const list of Object.values(lists)) {
	list.addEventListener('dragover', (event) => {
		if (!dragged) {
			return
		}
		event.preventDefault()
		event.dataTransfer.dropEffect = 'move'
		const after = itemAfter(list, event.clientY)
		if (after === null) {
			list.append(dragged)
		} else if (after !== dragged.nextElementSibling) {
			after.before(dragged)
		}
	})
	list.addEventListener('drop', (event) => {
		event.preventDefault()
		changed()
	})
}

function render() {
	const { top, waffle } = partition()
	lists.top.replaceChildren(...top.map(createItem))
	lists.waffle.replaceChildren(...waffle.map(createItem))
	root.querySelector(`[name="classic-appmenu-unassigned"][value="${config.unassigned === 'waffle' ? 'waffle' : 'top'}"]`).checked = true
	root.querySelector(`[name="classic-appmenu-position"][value="${config.wafflePosition === 'start' ? 'start' : 'end'}"]`).checked = true
	document.getElementById('classic-appmenu-shows-all').checked = !!config.waffleShowsAll
}

function collect() {
	const ids = (list) => [...list.children].map((item) => item.dataset.id)
	return {
		top: ids(lists.top),
		waffle: ids(lists.waffle),
		unassigned: root.querySelector('[name="classic-appmenu-unassigned"]:checked')?.value ?? 'top',
		wafflePosition: root.querySelector('[name="classic-appmenu-position"]:checked')?.value ?? 'end',
		waffleShowsAll: document.getElementById('classic-appmenu-shows-all').checked,
	}
}

async function send(method, body) {
	const response = await fetch(url(), {
		method,
		headers: {
			'Content-Type': 'application/json',
			requesttoken: requestToken(),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	})
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`)
	}
	return response.json()
}

async function save() {
	setStatus(translate('Saving …'))
	try {
		config = await send('PUT', collect())
		render()
		setStatus(translate('Saved. Reload the page to see the changes in the header.'))
	} catch (error) {
		console.error(`[${APP_ID}] Could not save the settings`, error)
		setStatus(translate('Could not save the settings'), true)
	}
}

async function reset() {
	setStatus(translate('Saving …'))
	try {
		config = await send('DELETE')
		render()
		setStatus(translate('Reset to default. Reload the page to see the changes in the header.'))
	} catch (error) {
		console.error(`[${APP_ID}] Could not reset the settings`, error)
		setStatus(translate('Could not reset the settings'), true)
	}
}

root.querySelectorAll('input').forEach((input) => input.addEventListener('change', changed))
document.getElementById('classic-appmenu-save').addEventListener('click', save)
document.getElementById('classic-appmenu-reset').addEventListener('click', reset)

render()
