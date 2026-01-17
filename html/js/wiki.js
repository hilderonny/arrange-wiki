import { SSO, FILES } from '../arrange.js'

let HIERARCHY

function createHierarchyElement(node) {
    const domElement = document.createElement('div')
    const label = document.createElement('label')
    label.innerHTML = node.label
    domElement.appendChild(label)
    return domElement
}

async function handleAddButtonClicked() {
    const filename = '' + Math.floor(Date.now() * 100000 + Math.random() * 100000)
    HIERARCHY.push({
        filename: filename,
        label: 'Neuer Eintrag',
        children: []
    })
    updateHierarchyDom()
}

async function loadHierarchyFromServer() {
    const file = await FILES.getFile('/wiki/hierarchy.json', true)
    if (file.status === 404) {
        HIERARCHY = []
        await saveHierarchyToServer()
    } else {
        HIERARCHY = await file.json()
    }
}

async function saveHierarchyToServer() {
    await FILES.saveFile('/wiki/hierarchy.json', JSON.stringify(HIERARCHY), true)
}

function updateDomElement(domElement, children) {
    for (const child of children) {
        const childElement = createHierarchyElement(child)
        domElement.appendChild(childElement)
        if (child.children) {
            updateDomElement(childElement, child.children)
        }
    }
}

function updateHierarchyDom() {
    const hierarchy = document.getElementById('hierarchy')
    hierarchy.innerHTML = ''
    updateDomElement(hierarchy, HIERARCHY)
}

document.getElementById('addbutton').addEventListener('click', handleAddButtonClicked)

await loadHierarchyFromServer()
updateHierarchyDom()