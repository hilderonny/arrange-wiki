import * as Arrange from '/arrange/js/arrange.js'

let HIERARCHY
let SELECTED_HIERARCHY_DOM_ELEMENT

// Erstellt ein DIV für einen Hierarchieeintrag
async function createHierarchyDomElement(hierarchyNode, selectedNode) {
    const domElement = document.createElement('div')
    domElement.hierarchyNode = hierarchyNode
    const label = document.createElement('label')
    label.innerHTML = hierarchyNode.label
    label.addEventListener('click', async () => selectHierarchyDomElement(domElement))
    domElement.appendChild(label)
    for (const childNode of hierarchyNode.children) {
        domElement.appendChild(await createHierarchyDomElement(childNode, selectedNode))
    }
    if (hierarchyNode === selectedNode) {
        await selectHierarchyDomElement(domElement)
    }
    return domElement
}

// Beendet den Bearbeiten-Modus
function hideEditor() {
    document.getElementById('content').classList.remove('invisible')
    document.getElementById('editor').classList.add('invisible')
    document.getElementById('editbutton').classList.remove('invisible')
    document.getElementById('savebutton').classList.add('invisible')
    document.getElementById('cancelbutton').classList.add('invisible')
}

// Lädt die Hierarchie vom Server, wird einmalig beim Start oder beim Refresh gemacht
async function loadHierarchy() {
    const file = await Arrange.getPublicFile('/wiki/hierarchy.json')
    if (file.status === 404) {
        HIERARCHY = []
        await saveHierarchy()
    } else {
        HIERARCHY = await file.json()
    }
}

// Baut den DOM der Hierarchie komplett neu auf, wird nach jeder Änderung gemacht
async function rebuildHierarchyDom(selectedNode) {
    const hierarchy = document.getElementById('hierarchy')
    hierarchy.innerHTML = ''
    for (const childNode of HIERARCHY) {
        hierarchy.appendChild(await createHierarchyDomElement(childNode, selectedNode))
    }
}

// Speichert die Hierarchie auf dem Server, wird nach jeder Veränderung der Hierarchie gemacht
async function saveHierarchy() {
    await Arrange.postPublicFile('/wiki/hierarchy.json', JSON.stringify(HIERARCHY))
}

// Markiert ein Hierarchieelement, wenn es angeklickt wurde
async function selectHierarchyDomElement(domElement) {
    if (SELECTED_HIERARCHY_DOM_ELEMENT) {
        SELECTED_HIERARCHY_DOM_ELEMENT.classList.remove('selected')
    }
    SELECTED_HIERARCHY_DOM_ELEMENT = domElement
    SELECTED_HIERARCHY_DOM_ELEMENT.classList.add('selected')
    const response = await Arrange.getPublicFile('/wiki/nodes/' + SELECTED_HIERARCHY_DOM_ELEMENT.hierarchyNode.filename)
    const fileContent = response.ok ? await response.text() : ''
    document.getElementById('content').innerHTML = fileContent
    document.getElementById('deletebutton').classList.remove('invisible')
    hideEditor()
}

// Zeigt den Bearbeiten-Modus und übernimmt das HTML des selektierten Elementes in das Textfeld
function showEditor() {
    const contentDiv = document.getElementById('content')
    contentDiv.classList.add('invisible')
    const editorTextArea = document.getElementById('editor')
    editorTextArea.value = contentDiv.innerHTML
    editorTextArea.classList.remove('invisible')
    document.getElementById('editbutton').classList.add('invisible')
    document.getElementById('savebutton').classList.remove('invisible')
    document.getElementById('cancelbutton').classList.remove('invisible')
}

// Wenn der "Neu" - Button angeklickt wurde wird an dem selektierten Hierarchieelement ein neues Unterelement erstellt
document.getElementById('addbutton').addEventListener('click', async () => {
    const label = prompt('Bezeichnung für neuen Eintrag', 'Neuer Eintrag')
    if (!label) return
    const filename = '' + Math.floor(Date.now() * 100000 + Math.random() * 100000)
    const childrenList = SELECTED_HIERARCHY_DOM_ELEMENT ? SELECTED_HIERARCHY_DOM_ELEMENT.hierarchyNode.children : HIERARCHY
    const newChild = {
        filename: filename,
        label: label,
        children: []
    }
    childrenList.push(newChild)
    await Arrange.postPublicFile('/wiki/nodes/' + filename, '<h1>' + label + '</h1>\n')
    await saveHierarchy()
    await rebuildHierarchyDom(newChild)
    showEditor()
})

// Mit dem Bearbeiten-Button wird der Bearbeiten-Modus aktiviert
document.getElementById('editbutton').addEventListener('click', async () => {
    showEditor()
})

// Mit dem Abbrechen-Button wird der Bearbeiten-Modus deaktiviert
document.getElementById('cancelbutton').addEventListener('click', async () => {
    hideEditor()
})

// BeimSpeichern wird der Inhalt auf dem Server gespeichert und der Bearbeiten-Modus beendet
document.getElementById('savebutton').addEventListener('click', async () => {
    const content = document.getElementById('editor').value
    await Arrange.postPublicFile('/wiki/nodes/' + SELECTED_HIERARCHY_DOM_ELEMENT.hierarchyNode.filename, content)
    document.getElementById('content').innerHTML = content
    hideEditor()
})

await loadHierarchy()
rebuildHierarchyDom()