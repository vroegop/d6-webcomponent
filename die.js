class Die3D extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        this.attachShadow({mode: 'open'});
        // Read custom properties users can set
        this.setInitialValues();
        // Settings these variables before rendering makes sure no unwanted animations happen on load
        this.setCssParameters();
        // Render HTML and CSS
        await this.render();
        // Size is a CSS variable but can only be determined after rendering. This will cause an animation.
        this.setSize();
        // Call rollDice once with this.lastNumber to set a default value set on the component or 0
        this.rollDie(this.lastNumber);
        // Actually roll the die :)
        this.addEventListener('click', () => this.rollDie());
    }

    setInitialValues() {
        this.diecoloreven = this.getAttribute('bgcoloreven') || this.getAttribute('bgcolor') || 'goldenrod';
        this.diecolorodd = this.getAttribute('bgcolorodd') || this.getAttribute('bgcolor') || 'darkgoldenrod';
        this.dotcolor = this.getAttribute('dotcolor') || '#4b4b4b';
        this.time = this.getAttribute('time') || '2';
        this.lastNumber = +(this.getAttribute('initialvalue') || 0);
        this.allowedRolls = +(this.getAttribute('allowedrolls') ?? 10000);
        this.minrollvalue = +(this.getAttribute('minrollvalue') ?? 1);
        this.maxrollvalue = +(this.getAttribute('maxrollvalue') ?? 20);
        this.isDisabled = this.allowedRolls < 1;
        this.totalRolls = 0;
    }

    rollDie(value) {
        // If a default value is set, we don't count it as a roll and only animate the die to that value
        if (typeof value === 'number') {
            // Set the title so hovering the cursor shows the value as a number
            this.setAttribute('title', this.lastNumber);
            this.shadowRoot.getElementById('die').setAttribute('data-face', this.lastNumber);
            if (this.isDisabled) {
                this.style.setProperty('--die-color-even', 'rgb(70, 70, 70)');
                this.style.setProperty('--die-color-odd', 'rgb(75, 75, 75)');
                this.style.setProperty('--dot-color', 'rgb(164,164,164)');
            }
            return;
        }
        // If no default value is set, we will simply roll a new value and count the allowed rolls
        if (!this.isDisabled) {
            // Determine new die value, random but between the min and max value specified
            this.lastNumber = value || Math.floor(Math.random() * (this.maxrollvalue - this.minrollvalue + 1) + this.minrollvalue);
            // Dispatch an event so external objects know what the throw was
            this.dispatchEvent(new CustomEvent('selection', {detail: this.lastNumber}));
            // Set the title so hovering the cursor shows the value as a number
            this.setAttribute('title', this.lastNumber);
            // Update the HTML to animate the die to the new value
            this.shadowRoot.getElementById('die').setAttribute('data-face', this.lastNumber);
            // Bookkeeping
            this.allowedRolls -= 1;
            this.totalRolls ++;
            // Make sure the die always rolls, also if the same value is thrown twice
            this.style.setProperty('--total-rolls', ((+this.totalRolls - 1) * Math.floor((+this.time))) + 'turn');
        }
        this.isDisabled = this.allowedRolls < 1;

        if (this.isDisabled) {
            setTimeout(() => {
                if (this.isDisabled) {
                    this.style.setProperty('--die-color-even', 'rgb(70, 70, 70)');
                    this.style.setProperty('--die-color-odd', 'rgb(75, 75, 75)');
                    this.style.setProperty('--dot-color', 'rgb(155, 155, 155)');
                }
            }, this.time * 1000);
        }
    }

    setCssParameters() {
        this.style.setProperty('--roll-time', this.time + 's');
        this.style.setProperty('--die-color-even', this.diecoloreven);
        this.style.setProperty('--die-color-odd', this.diecolorodd);
        this.style.setProperty('--dot-color', this.dotcolor);
        this.style.setProperty('--total-rolls', ((+this.totalRolls - 1) * Math.floor((+this.time))) + 'turn');
    }

    setSize() {
        this.style.setProperty('--die-size',  (this.clientHeight || 120) + 'px');
    }

    async render() {
        let dieCode = '';
        if (this.maxrollvalue > 12) {
            dieCode = await this.getD20();
        } else if (this.maxrollvalue > 10) {
            dieCode = await this.getD12();
        } else if (this.maxrollvalue > 8) {
            dieCode = await this.getD10();
        } else if (this.maxrollvalue === 6) {
            dieCode = await this.getD6();
        } else {
            dieCode = await this.getD8();
        }
        this.shadowRoot.innerHTML = `
            ${dieCode}
            <style>
                :host {
                  position:relative;
                  display:inline-block;
                  font-family: arial;
                }
            </style>
        `;
    }

    async getD20() {
        const { D20Die } = await import('./d20-die.js');
        return `${D20Die.getHtml()} ${D20Die.getCss()}`;
    }

    async getD12() {
        const { D12Die } = await import('./d12-die.js');
        return `${D12Die.getHtml()} ${D12Die.getCss()}`;
    }

    async getD10() {
        const { D10Die } = await import('./d10-die.js');
        return `${D10Die.getHtml()} ${D10Die.getCss()}`;
    }

    async getD8() {
        const { D8D4Die } = await import('./d8-d4-die.js');
        return `${D8D4Die.getHtml(this.maxrollvalue)} ${D8D4Die.getCss()}`;
    }

    async getD6() {
        const { D6Die } = await import('./d6-die.js');
        return `${D6Die.getHtml()} ${D6Die.getCss()}`;
    }
}

customElements.define('die-3d', Die3D);