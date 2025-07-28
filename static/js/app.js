"use strict";
class JSONViewer {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }
    initializeElements() {
        this.jsonInput = document.getElementById('jsonInput');
        this.formattedOutput = document.getElementById('formattedOutput');
        this.treeOutput = document.getElementById('treeOutput');
        this.errorMessage = document.getElementById('errorMessage');
        this.formatBtn = document.getElementById('formatBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
    }
    bindEvents() {
        this.formatBtn.addEventListener('click', () => this.formatJSON());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target;
                const tabName = target.getAttribute('data-tab');
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
        this.jsonInput.addEventListener('input', () => this.hideError());
    }
    formatJSON() {
        const input = this.jsonInput.value.trim();
        if (!input) {
            this.showError('Please enter some JSON data');
            return;
        }
        try {
            let parsedJSON;
            try {
                parsedJSON = JSON.parse(input);
            }
            catch {
                const decodedInput = decodeURIComponent(input);
                parsedJSON = JSON.parse(decodedInput);
            }
            const formattedJSON = JSON.stringify(parsedJSON, null, 2);
            this.formattedOutput.textContent = formattedJSON;
            this.generateTreeView(parsedJSON);
            this.hideError();
        }
        catch (error) {
            this.showError(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    generateTreeView(data) {
        this.treeOutput.innerHTML = '';
        const rootNode = this.createTreeNode(data, 'root');
        this.treeOutput.appendChild(rootNode);
    }
    createTreeNode(value, key, level = 0) {
        const container = document.createElement('div');
        container.className = 'tree-node';
        container.style.marginLeft = `${level * 20}px`;
        const header = document.createElement('div');
        header.className = 'tree-node-header';
        const type = this.getValueType(value);
        const isExpandable = type === 'object' || type === 'array';
        if (isExpandable) {
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle';
            toggle.textContent = '▼';
            toggle.addEventListener('click', () => this.toggleNode(container, toggle));
            header.appendChild(toggle);
        }
        else {
            const spacer = document.createElement('span');
            spacer.className = 'tree-spacer';
            header.appendChild(spacer);
        }
        const keySpan = document.createElement('span');
        keySpan.className = 'tree-key';
        if (key && key !== 'root') {
            keySpan.textContent = `"${key}": `;
        }
        header.appendChild(keySpan);
        const valueSpan = document.createElement('span');
        valueSpan.className = `tree-value tree-${type}`;
        if (type === 'object') {
            const keys = Object.keys(value);
            valueSpan.textContent = `{} (${keys.length} ${keys.length === 1 ? 'property' : 'properties'})`;
        }
        else if (type === 'array') {
            valueSpan.textContent = `[] (${value.length} ${value.length === 1 ? 'item' : 'items'})`;
        }
        else if (type === 'string') {
            valueSpan.textContent = `"${value}"`;
        }
        else {
            valueSpan.textContent = String(value);
        }
        header.appendChild(valueSpan);
        container.appendChild(header);
        if (isExpandable) {
            const childContainer = document.createElement('div');
            childContainer.className = 'tree-children';
            if (type === 'object') {
                Object.entries(value).forEach(([childKey, childValue]) => {
                    const childNode = this.createTreeNode(childValue, childKey, level + 1);
                    childContainer.appendChild(childNode);
                });
            }
            else if (type === 'array') {
                value.forEach((childValue, index) => {
                    const childNode = this.createTreeNode(childValue, `[${index}]`, level + 1);
                    childContainer.appendChild(childNode);
                });
            }
            container.appendChild(childContainer);
        }
        return container;
    }
    toggleNode(container, toggle) {
        const children = container.querySelector('.tree-children');
        if (children) {
            const isExpanded = children.style.display !== 'none';
            children.style.display = isExpanded ? 'none' : 'block';
            toggle.textContent = isExpanded ? '▶' : '▼';
        }
    }
    getValueType(value) {
        if (value === null)
            return 'null';
        if (Array.isArray(value))
            return 'array';
        return typeof value;
    }
    switchTab(tabName) {
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeBtn && activeContent) {
            activeBtn.classList.add('active');
            activeContent.classList.add('active');
        }
    }
    clearAll() {
        this.jsonInput.value = '';
        this.formattedOutput.textContent = '';
        this.treeOutput.innerHTML = '';
        this.hideError();
    }
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }
    hideError() {
        this.errorMessage.classList.add('hidden');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new JSONViewer();
});
//# sourceMappingURL=app.js.map