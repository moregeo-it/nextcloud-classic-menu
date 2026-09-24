/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { readFileSync, readdirSync } from 'node:fs'

const sources = ['templates/admin.php', 'js/main.mjs', 'js/admin.mjs']
const pattern = /(?:\$l->t|translate)\('((?:[^'\\]|\\.)*)'/g

const wanted = new Set()
for (const file of sources) {
	for (const match of readFileSync(file, 'utf8').matchAll(pattern)) {
		wanted.add(match[1].replace(/\\'/g, "'"))
	}
}

const languageFiles = readdirSync('l10n').filter((name) => name.endsWith('.json'))
let failed = false
for (const file of languageFiles) {
	const { translations } = JSON.parse(readFileSync(`l10n/${file}`, 'utf8'))
	const missing = [...wanted].filter((key) => !(key in translations))
	const stale = Object.keys(translations).filter((key) => !wanted.has(key))
	if (missing.length || stale.length) {
		failed = true
		console.error(`${file}: missing ${JSON.stringify(missing)}, stale ${JSON.stringify(stale)}`)
	}
}

if (failed) {
	process.exit(1)
}
console.log(`${wanted.size} strings checked in ${languageFiles.length} language files`)
