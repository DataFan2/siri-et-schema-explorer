let path = [];
let selectedLeaf = null;

// Flache Liste aller Elemente im Baum, fuer die Suche.
// Jeder Eintrag speichert das Element selbst und den Pfad (die Vorfahren) dorthin.
let searchIndex = [];

fetch("data.json")
    .then(response => response.json())
    .then(data => {
        path = [data];
        searchIndex = buildSearchIndex(data, []);
        render();
    });

// Geht rekursiv durch den ganzen Baum und sammelt jedes Element
// zusammen mit der Liste seiner Vorfahren (ancestors).
function buildSearchIndex(node, ancestors) {
    let index = [{ node: node, ancestors: ancestors }];

    node.children.forEach(child => {
        index = index.concat(buildSearchIndex(child, ancestors.concat([node])));
    });

    return index;
}

function render() {
    renderBreadcrumb();
    renderDescription();
    renderContent();
}

function renderBreadcrumb() {
    const breadcrumb = document.getElementById("breadcrumb");
    breadcrumb.innerHTML = "";

    path.forEach((node, index) => {
        const crumb = document.createElement("span");
        crumb.textContent = node.name;
        crumb.className = "crumb";

        crumb.addEventListener("click", () => {
            path = path.slice(0, index + 1);
            selectedLeaf = null;
            render();
        });

        breadcrumb.appendChild(crumb);

        if (index < path.length - 1) {
            const separator = document.createTextNode(" > ");
            breadcrumb.appendChild(separator);
        }
    });
}

function renderDescription() {
    const description = document.getElementById("description");
    const node = selectedLeaf || path[path.length - 1];
    const text = node.beschreibung.trim();

    if (text.length > 0) {
        description.textContent = text;
        description.lang = "en";
    } else {
        description.textContent = "Keine Beschreibung vorhanden.";
        description.lang = "de";
    }
}


function renderContent() {
    const content = document.getElementById("content");
    content.innerHTML = "";

    const currentNode = path[path.length - 1];
    const parentNode = path.length >= 2 ? path[path.length - 2] : null;

    const innerBox = buildBox(currentNode);

    if (parentNode) {
        const outerBox = document.createElement("div");
        outerBox.className = "nest-box outer";

        const outerLabel = document.createElement("div");
        outerLabel.className = "nest-box-label outer-label";
        outerLabel.textContent = parentNode.name;

        outerLabel.addEventListener("click", () => {
            path = path.slice(0, path.length - 1);
            selectedLeaf = null;
            render();
        });

        outerBox.appendChild(outerLabel);
        outerBox.appendChild(innerBox);
        content.appendChild(outerBox);
    } else {
        content.appendChild(innerBox);
    }

    // Wenn ein Blatt-Element markiert ist (z.B. durch die Suche), dorthin scrollen.
    if (selectedLeaf) {
        const selectedEl = content.querySelector(".child-box.selected");
        if (selectedEl) {
            selectedEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }
}

function buildBox(node) {
    const box = document.createElement("div");
    box.className = "nest-box";

    const label = document.createElement("div");
    label.className = "nest-box-label";
    label.textContent = node.name;
    box.appendChild(label);

    const inner = document.createElement("div");
    inner.className = "nest-box-inner";

    node.children.forEach(child => {
        const hasChildren = child.children.length > 0;

        const item = document.createElement("div");
        const isSelected = selectedLeaf === child;
        item.className = (hasChildren ? "child-box" : "child-box leaf") + " card-" + child.cardinality + (isSelected ? " selected" : "");

        const name = document.createElement("span");
        name.className = "item-name";
        name.textContent = child.name;
        item.appendChild(name);

        const badge = document.createElement("span");
        badge.className = "badge badge-" + child.cardinality;
        badge.textContent = child.cardinality;
        item.appendChild(badge);

        if (hasChildren) {
            const count = document.createElement("span");
            count.className = "child-count";
            count.textContent = child.children.length + " Kinder";
            item.appendChild(count);
        }

        item.addEventListener("click", () => {
            if (hasChildren) {
                selectedLeaf = null;
                path.push(child);
            } else {
                selectedLeaf = child;
            }
            render();
        });

        inner.appendChild(item);
    });

    box.appendChild(inner);
    return box;
}
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = "";

    if (query.length === 0) {
        return;
    }

    // Nur Elemente, deren Name die Sucheingabe enthaelt.
    const matches = searchIndex.filter(entry =>
        entry.node.name.toLowerCase().includes(query)
    ).slice(0, 8); // maximal 8 Treffer anzeigen

    matches.forEach(entry => {
        const result = document.createElement("div");
        result.className = "search-result";

        const name = document.createElement("div");
        name.className = "search-result-name";
        name.textContent = entry.node.name;
        result.appendChild(name);

        const pathText = document.createElement("div");
        pathText.className = "search-result-path";
        pathText.textContent = entry.ancestors.map(a => a.name).join(" > ") || "Wurzelelement";
        result.appendChild(pathText);

        result.addEventListener("click", () => {
            const hasChildren = entry.node.children.length > 0;

            if (hasChildren) {
                path = entry.ancestors.concat([entry.node]);
                selectedLeaf = null;
            } else {
                path = entry.ancestors;
                selectedLeaf = entry.node;
            }

            searchInput.value = "";
            searchResults.innerHTML = "";
            render();
        });

        searchResults.appendChild(result);
    });
});
