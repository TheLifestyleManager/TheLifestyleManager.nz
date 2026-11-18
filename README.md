# TheLifestyleManager.nz

The Hermes setup wizard for The Lifestyle Manager. Plain HTML, CSS and JS modules.
No build step: GitHub Pages serves `main` as is, so a push goes live in about a minute.

## Files

* `index.html`, `styles.css`: page shell and look.
* `wizard.js`: step engine, saving progress, sending the brief.
* `catalogue.js`: the skill gallery, tools and chat apps. Edit here to add a skill.
* `steps.js`: the questions and branch rules.
* `brief.js`: turns answers into the brief Josh and Farley get by email.
* `check.mjs`: run `node check.mjs` before every push. It must print PASS.

## Preview

`python3 -m http.server 8777` in this folder, then open http://127.0.0.1:8777/.
Opening the file directly does not work, because the browser blocks JS modules from `file://`.

Answers never go in this repo. They are emailed through FormSubmit.
