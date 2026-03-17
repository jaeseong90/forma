/**
 * FormaForm - 입력 폼 빌더
 * text, number, date, combo, textarea, checkbox 위젯 지원.
 */
class FormaForm {
    constructor(selector, fields) {
        this.container = document.querySelector(selector);
        this.fields = fields;
        this.inputs = {};
        this._build();
    }

    _build() {
        this.container.innerHTML = '';
        this.container.classList.add('forma-form');

        for (const f of this.fields) {
            const row = document.createElement('div');
            row.className = 'forma-form-row';

            const label = document.createElement('label');
            label.textContent = f.label || f.field;
            if (f.required) label.classList.add('required');
            row.appendChild(label);

            let input;
            if (f.widget === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 3;
            } else if (f.widget === 'combo' && f.code) {
                input = document.createElement('select');
                input.innerHTML = '<option value="">선택</option>';
                getCodeItems(f.code).then(items => {
                    items.forEach(item => {
                        const opt = document.createElement('option');
                        opt.value = item.value;
                        opt.textContent = item.label;
                        input.appendChild(opt);
                    });
                });
            } else if (f.widget === 'checkbox') {
                input = document.createElement('input');
                input.type = 'checkbox';
            } else {
                input = document.createElement('input');
                input.type = f.type === 'number' || f.type === 'decimal' ? 'number' : f.type === 'date' ? 'date' : 'text';
            }

            input.className = 'forma-input';
            if (f.readOnly) input.readOnly = true;
            row.appendChild(input);
            this.container.appendChild(row);
            this.inputs[f.field] = input;
        }
    }

    getData() {
        const result = {};
        for (const [key, el] of Object.entries(this.inputs)) {
            if (el.type === 'checkbox') result[key] = el.checked;
            else if (el.type === 'number') result[key] = el.value ? Number(el.value) : null;
            else result[key] = el.value || null;
        }
        return result;
    }

    setData(obj) {
        for (const [key, el] of Object.entries(this.inputs)) {
            if (el.type === 'checkbox') el.checked = !!obj[key];
            else el.value = obj[key] ?? '';
        }
    }

    clear() {
        for (const el of Object.values(this.inputs)) {
            if (el.type === 'checkbox') el.checked = false;
            else el.value = '';
        }
    }
}
