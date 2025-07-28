interface JSONTreeNode {
    key?: string;
    value: any;
    type: string;
    children?: JSONTreeNode[];
}

class JSONViewer {
    private jsonInput!: HTMLTextAreaElement;
    private formattedOutput!: HTMLPreElement;
    private treeOutput!: HTMLDivElement;
    private errorMessage!: HTMLDivElement;
    private formatBtn!: HTMLButtonElement;
    private clearBtn!: HTMLButtonElement;
    private tabBtns!: NodeListOf<HTMLButtonElement>;
    private tabContents!: NodeListOf<HTMLDivElement>;

    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    private initializeElements(): void {
        this.jsonInput = document.getElementById('jsonInput') as HTMLTextAreaElement;
        this.formattedOutput = document.getElementById('formattedOutput') as HTMLPreElement;
        this.treeOutput = document.getElementById('treeOutput') as HTMLDivElement;
        this.errorMessage = document.getElementById('errorMessage') as HTMLDivElement;
        this.formatBtn = document.getElementById('formatBtn') as HTMLButtonElement;
        this.clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
    }

    private bindEvents(): void {
        this.formatBtn.addEventListener('click', () => this.formatJSON());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const tabName = target.getAttribute('data-tab');
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        this.jsonInput.addEventListener('input', () => this.hideError());
    }

    private formatJSON(): void {
        const input = this.jsonInput.value.trim();
        if (!input) {
            this.showError('Please enter some JSON data');
            return;
        }

        try {
            let parsedJSON: any;
            
            try {
                parsedJSON = JSON.parse(input);
            } catch {
                const decodedInput = decodeURIComponent(input);
                parsedJSON = JSON.parse(decodedInput);
            }

            const formattedJSON = JSON.stringify(parsedJSON, null, 2);
            this.formattedOutput.textContent = formattedJSON;
            
            this.generateTreeView(parsedJSON);
            this.hideError();
            
        } catch (error) {
            this.showError(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private generateTreeView(data: any): void {
        this.treeOutput.innerHTML = '';
        const rootNode = this.createTreeNode(data, 'root');
        this.treeOutput.appendChild(rootNode);
    }

    private createTreeNode(value: any, key?: string, level: number = 0): HTMLElement {
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
        } else {
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
        } else if (type === 'array') {
            valueSpan.textContent = `[] (${value.length} ${value.length === 1 ? 'item' : 'items'})`;
        } else if (type === 'string') {
            valueSpan.textContent = `"${value}"`;
        } else {
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
            } else if (type === 'array') {
                value.forEach((childValue: any, index: number) => {
                    const childNode = this.createTreeNode(childValue, `[${index}]`, level + 1);
                    childContainer.appendChild(childNode);
                });
            }

            container.appendChild(childContainer);
        }

        return container;
    }

    private toggleNode(container: HTMLElement, toggle: HTMLElement): void {
        const children = container.querySelector('.tree-children') as HTMLElement;
        if (children) {
            const isExpanded = children.style.display !== 'none';
            children.style.display = isExpanded ? 'none' : 'block';
            toggle.textContent = isExpanded ? '▶' : '▼';
        }
    }

    private getValueType(value: any): string {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    private switchTab(tabName: string): void {
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));

        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`) as HTMLElement;
        const activeContent = document.getElementById(`${tabName}-tab`) as HTMLElement;

        if (activeBtn && activeContent) {
            activeBtn.classList.add('active');
            activeContent.classList.add('active');
        }
    }

    private clearAll(): void {
        this.jsonInput.value = '';
        this.formattedOutput.textContent = '';
        this.treeOutput.innerHTML = '';
        this.hideError();
    }

    private showError(message: string): void {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    private hideError(): void {
        this.errorMessage.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JSONViewer();
});