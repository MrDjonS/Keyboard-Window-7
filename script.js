const textInput = document.getElementById("textInput");
const keyboard = document.getElementById("keyboard");

class VirtualKeyboard {
    constructor(inputElement, keyboardElement) {
        this.inputElement = inputElement;
        this.keyboardElement = keyboardElement;

        this.helpText = {
            title: "Справка по горячим клавишам:",
            hotkeys: [
                "<b>Ctrl + Backspace:</b> Удалить весь текст.",
                "<b>Delete:</b> Удалить символ справа от курсора или выделенный текст.",
                "<b>Backspace:</b> Удалить символ слева от курсора или выделенный текст.",
                "<b>Shift + Alt:</b> Переключить язык.",
                "<b>Ctrl + C:</b> Скопировать выделенный текст.",
                "<b>Ctrl + V:</b> Вставить текст из буфера обмена.",
                "<b>Ctrl + Z:</b> Отменить последнее действие.",
                "<b>Alt  + F4:</b> 1 млн долларов .",
            ],
              closeButtonText: "Закрыть"
         };
        this.layouts = {
            en: [
                ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
                ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
                ["Caps Lock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
                ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
                ["Ctrl", "Alt", "Space", "Alt", "Ctrl"]
            ],
            ru: [
                ["ё", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
                ["Tab", "Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ", "\\"],
                ["Caps Lock", "Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э", "Enter"],
                 ["Shift", "Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю", ".", "Shift"],
                ["Ctrl", "Alt", "Space", "Alt", "Ctrl"]
            ]
        };
        this.currentLayout = "en";
        this.capsLock = false;
        this.shiftPressed = false;
        this.undoStack = [];
        this.redoStack = [];
        this.cursorPosition = 0;
        
         this.helpButton = document.getElementById('helpButton');
         this.helpModal = document.getElementById('helpModal');
        this.closeModal = document.getElementById('closeModal');
       
        this.init();
    }

    init() {
        this.renderKeyboard();
        this.setupEventListeners();
        this.helpButton.addEventListener('mousedown', () => this.openModal());
        this.closeModal.addEventListener('mousedown', () => this.closeModalFunc());
        this.updateCursor();
    }

    renderKeyboard() {
        this.keyboardElement.innerHTML = "";
        this.layouts[this.currentLayout].forEach(row => {
            const rowElement = document.createElement("div");
            rowElement.className = "row";
            row.forEach(key => {
                const keyElement = document.createElement("div");
                keyElement.className = "key";
                keyElement.textContent = this.getKeyText(key);

                if (key === "Space") {
                    keyElement.classList.add("extra-wide-key");
                    keyElement.style.width = "300px";
                    keyElement.addEventListener("mousedown", () => this.handleKeyInput(" "));
                } else if (key === "Backspace") {
                    keyElement.classList.add("wide-key");
                   this.addHoldingEvent(keyElement, () => this.handleBackspace());
                 }
                 else if (key === "Enter") {
                    keyElement.classList.add("wide-key");
                    keyElement.addEventListener("mousedown", () => this.handleKeyInput("\n"));
                } else if (key === "Caps Lock") {
                    keyElement.classList.add("wide-key");
                    keyElement.addEventListener("mousedown", () => this.toggleCapsLock());
                } else if (key === "Shift") {
                    keyElement.classList.add("wide-key");
                     keyElement.addEventListener("mousedown", () => this.handleShiftDown());
                    keyElement.addEventListener("mouseup", () => this.handleShiftUp());
                    keyElement.addEventListener("mouseleave", () => this.handleShiftUp());
                }

                else if (["Alt", "Ctrl", "Tab"].includes(key)) {
                    keyElement.classList.add("wide-key");
                } else {
                      this.addHoldingEvent(keyElement, () => this.handleKeyInput(this.getKeyText(key)));
                }

                rowElement.appendChild(keyElement);
            });
            this.keyboardElement.appendChild(rowElement);
        });
    }

    handleShiftDown() {
        this.shiftPressed = true;
        this.renderKeyboard();
    }
    handleShiftUp() {
        this.shiftPressed = false;
        this.renderKeyboard();
    }
    getKeyText(key) {
        if (key.length === 1 && /[a-zA-Zа-яёА-ЯЁ]/.test(key)) {
            if (this.shiftPressed) {
                return this.capsLock ? key.toLowerCase() : key.toUpperCase();
            }
            return this.capsLock ? key.toUpperCase() : key.toLowerCase();
        }
        return key;
    }

    addHoldingEvent(element, callback) {
        let interval;
        element.addEventListener("mousedown", () => {
            callback();
            interval = setInterval(callback, 100);
        });
        ["mouseup", "mouseleave"].forEach(event => {
            element.addEventListener(event, () => clearInterval(interval));
        });
    }
   handleBackspace() {
       this.saveState();
        if (this.inputElement.selectionStart === this.inputElement.selectionEnd) {
            if (this.cursorPosition > 0) {
                 this.inputElement.value = this.inputElement.value.slice(0, this.cursorPosition - 1) + this.inputElement.value.slice(this.cursorPosition);
                this.cursorPosition--;
            }
        } else {
             this.inputElement.value = this.inputElement.value.slice(0, this.inputElement.selectionStart) + this.inputElement.value.slice(this.inputElement.selectionEnd);
             this.cursorPosition = this.inputElement.selectionStart;
         }
        this.updateCursor();
    }

    handleKeyInput(char) {
        this.saveState();
        this.inputElement.value = this.inputElement.value.slice(0, this.cursorPosition) + char + this.inputElement.value.slice(this.cursorPosition);
        this.cursorPosition += char.length;
        this.updateCursor();
    }

    handlePaste() {
        navigator.clipboard.readText().then(text => {
            this.saveState();
             this.inputElement.value = this.inputElement.value.slice(0, this.cursorPosition) + text + this.inputElement.value.slice(this.cursorPosition);
             this.cursorPosition += text.length;
              this.updateCursor();
        });
    }
    
      toggleCapsLock() {
        this.capsLock = !this.capsLock;
        this.renderKeyboard();
    }
    openModal() {
       this.renderHelpModal();
       this.helpModal.style.display = 'block';
    }
     closeModalFunc() {
        this.helpModal.style.display = 'none';
    }
    switchLanguage() {
        const languages = Object.keys(this.layouts);
        const currentIndex = languages.indexOf(this.currentLayout);
        this.currentLayout = languages[(currentIndex + 1) % languages.length];
        this.renderKeyboard();
    }
    saveState() {
        this.undoStack.push({
            value: this.inputElement.value,
            cursorPosition: this.cursorPosition,
        });
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length > 0) {
            const previousState = this.undoStack.pop();
            this.redoStack.push({
                value: this.inputElement.value,
                cursorPosition: this.cursorPosition,
            });
           this.inputElement.value = previousState.value;
            this.cursorPosition = previousState.cursorPosition;
            this.updateCursor();
        }
    }
    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push({
                value: this.inputElement.value,
                cursorPosition: this.cursorPosition,
            });
            this.inputElement.value = nextState.value;
            this.cursorPosition = nextState.cursorPosition;
            this.updateCursor();
         }
    }
    updateCursor() {
        const text = this.inputElement.value.replace('|', '');
        this.inputElement.value = text;
        const textBeforeCursor = this.inputElement.value.slice(0, this.cursorPosition);
        const textAfterCursor = this.inputElement.value.slice(this.cursorPosition);
        this.inputElement.value = textBeforeCursor + "|" + textAfterCursor;
        this.inputElement.selectionStart = this.inputElement.selectionEnd = textBeforeCursor.length;
    }
     handleArrowLeft() {
         if (this.cursorPosition > 0) {
             this.cursorPosition--;
            this.updateCursor();
         }
    }

    handleArrowRight() {
        if (this.cursorPosition < this.inputElement.value.length) {
            this.cursorPosition++;
           this.updateCursor();
        }
    }
    renderHelpModal(){
         this.helpModal.innerHTML = '';
          const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const logo = document.createElement('img');
        logo.src = "Unofficial_Windows_logo_variant_-_2002–2012_(Multicolored).svg";
         logo.alt = "Windows Logo";
        logo.className = "modal-logo";

        const title = document.createElement('h2');
        title.textContent = this.helpText.title;

        modalContent.appendChild(logo);
        modalContent.appendChild(title);

        this.helpText.hotkeys.forEach(key => {
            const p = document.createElement('p');
             p.innerHTML = key;
            modalContent.appendChild(p);
        });

          const closeButton = document.createElement('button');
        closeButton.id = 'closeModal';
        closeButton.className = 'close-modal-button';
        closeButton.textContent = this.helpText.closeButtonText;
         closeButton.addEventListener('mousedown', () => this.closeModalFunc());
        modalContent.appendChild(closeButton)


        this.helpModal.appendChild(modalContent);
    }
    setupEventListeners() {
        const menuButtons = document.querySelectorAll('.menu-button');
        const keyboardContainer = document.querySelector('.keyboard-container');

        menuButtons.forEach(button => {
            button.addEventListener('click', () => {
                menuButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                if (button.dataset.target === 'keyboard-container') {

                }
            });
        });

        document.addEventListener("keydown", (event) => {
            const pressedKey = event.key;
            const keys = Array.from(this.keyboardElement.getElementsByClassName("key"));

              const virtualKey = keys.find(key =>
                key.textContent.toLowerCase() === pressedKey.toLowerCase() ||
                (pressedKey === " " && key.textContent === "Space") ||
                (pressedKey === "Backspace" && key.textContent === "Backspace") ||
                (pressedKey === "Enter" && key.textContent === "Enter") ||
                (pressedKey === "Tab" && key.textContent === "Tab") ||
                (pressedKey === "CapsLock" && key.textContent === "Caps Lock") ||
                  (pressedKey === "Shift" && key.textContent === "Shift")
            );
             if (event.ctrlKey && event.key === 'c') {
                this.handleCopy();
                event.preventDefault();
            } else if (event.ctrlKey && event.key === 'v') {
                this.handlePaste();
                event.preventDefault();
            } else if (event.ctrlKey && event.key === 'z') {
               this.undo();
                event.preventDefault();
           } else if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
                this.redo();
                event.preventDefault();
            }
            if (event.key === "ArrowLeft") {
                this.handleArrowLeft();
                event.preventDefault();
             } else if (event.key === "ArrowRight") {
                this.handleArrowRight();
                event.preventDefault();
            }
            if (virtualKey) {
                virtualKey.classList.add("active");
            }

            if (event.key === "CapsLock") {
                this.toggleCapsLock();
                event.preventDefault();
            } else if (event.key === "Backspace") {
                if (event.ctrlKey) {
                    this.inputElement.value = "";
                     this.cursorPosition = 0;
                    this.updateCursor();
                } else {
                     this.handleBackspace();
                 }
                event.preventDefault();
           }  else if (event.key === "Shift") {
                this.handleShiftDown()
                event.preventDefault();
            }

            else if (event.key.length === 1) {
                const char = this.getKeyText(event.key);
                this.handleKeyInput(char);
                event.preventDefault();
            } else if (event.shiftKey && event.altKey) {
                this.switchLanguage();
            }
        });

        document.addEventListener("keyup", (event) => {
            const pressedKey = event.key;
            const keys = Array.from(this.keyboardElement.getElementsByClassName("key"));

              const virtualKey = keys.find(key =>
                 key.textContent.toLowerCase() === pressedKey.toLowerCase() ||
                (pressedKey === " " && key.textContent === "Space") ||
                (pressedKey === "Backspace" && key.textContent === "Backspace") ||
                (pressedKey === "Enter" && key.textContent === "Enter") ||
                (pressedKey === "Tab" && key.textContent === "Tab") ||
                (pressedKey === "CapsLock" && key.textContent === "Caps Lock") ||
                (pressedKey === "Shift" && key.textContent === "Shift")
            );
            if (virtualKey) {
                virtualKey.classList.remove("active");
            }
            if (event.key === "Shift") {
                 this.handleShiftUp()
                event.preventDefault();
            }
        });
         this.inputElement.addEventListener('focus', () => {
            this.cursorPosition = this.inputElement.value.length;
            this.updateCursor();
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new VirtualKeyboard(textInput, keyboard);
});
