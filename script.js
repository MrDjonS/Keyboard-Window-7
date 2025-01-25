const textInput = document.getElementById("textInput");
const keyboard = document.getElementById("keyboard");
const copyButton = document.getElementById('copyButton');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const closeModal = document.getElementById('closeModal');

class VirtualKeyboard {
    constructor(inputElement, keyboardElement) {
        this.inputElement = inputElement;
        this.keyboardElement = keyboardElement;
        this.copyButton = copyButton;
        this.helpButton = helpButton;
        this.helpModal = helpModal;
        this.closeModal = closeModal;
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
        }; // ГДЕ ЯПОНСКИЙ >:(
        this.currentLayout = "en";
        this.capsLock = false;
        this.shiftPressed = false;
        this.undoStack = [];
        this.redoStack = [];
        this.init();
    }

    init() {
        this.renderKeyboard();
        this.setupEventListeners();
        this.copyButton.addEventListener('mousedown', () => this.handleCopy());
        this.helpButton.addEventListener('mousedown', () => this.openModal());
        this.closeModal.addEventListener('mousedown', () => this.closeModalFunc());
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
                }  else if (key === "Delete") {
                    keyElement.classList.add("wide-key");
                    keyElement.addEventListener("mousedown", () => this.handleDelete());
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

        // Большое проблема с клавишей Delete :(
         const deleteButton = document.createElement('div');
         deleteButton.className = 'key wide-key';
         deleteButton.textContent = 'Delete';
          this.addHoldingEvent(deleteButton, () => this.handleDelete());

         this.keyboardElement.lastChild.appendChild(deleteButton)

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
            this.inputElement.value = this.inputElement.value.slice(0, this.inputElement.selectionStart - 1) + this.inputElement.value.slice(this.inputElement.selectionEnd);
            this.inputElement.selectionStart = this.inputElement.selectionEnd = this.inputElement.selectionStart - 1;
         } else {
             this.inputElement.value = this.inputElement.value.slice(0, this.inputElement.selectionStart) + this.inputElement.value.slice(this.inputElement.selectionEnd);
            this.inputElement.selectionEnd = this.inputElement.selectionStart;
          }
    }

    handleDelete() {
         this.saveState();
        if (this.inputElement.selectionStart === this.inputElement.selectionEnd) {
             this.inputElement.value = this.inputElement.value.slice(0, this.inputElement.selectionStart ) + this.inputElement.value.slice(this.inputElement.selectionEnd + 1);
             this.inputElement.selectionStart = this.inputElement.selectionEnd = this.inputElement.selectionStart;
        } else {
            this.inputElement.value = this.inputElement.value.slice(0, this.inputElement.selectionStart) + this.inputElement.value.slice(this.inputElement.selectionEnd);
            this.inputElement.selectionEnd = this.inputElement.selectionStart;
         }
    }

    handleCopy() {
        if (this.inputElement.selectionStart !== this.inputElement.selectionEnd) {
            const selectedText = this.inputElement.value.substring(this.inputElement.selectionStart, this.inputElement.selectionEnd);
             navigator.clipboard.writeText(selectedText).then(() => {
  
             }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    }

    handleKeyInput(char) {
        this.saveState();
         if (this.inputElement.selectionStart === this.inputElement.selectionEnd) {
             this.inputElement.value = this.inputElement.value.slice(0,this.inputElement.selectionStart) + char + this.inputElement.value.slice(this.inputElement.selectionEnd);
             this.inputElement.selectionStart = this.inputElement.selectionEnd = this.inputElement.selectionStart + char.length;
        } else {
            this.inputElement.value = this.inputElement.value.slice(0, this.inputElement.selectionStart) + char + this.inputElement.value.slice(this.inputElement.selectionEnd);
            this.inputElement.selectionStart = this.inputElement.selectionEnd = this.inputElement.selectionStart + char.length;
         }
    }
    
    handlePaste() {
        navigator.clipboard.readText().then(text => {
           this.saveState();
            if(this.inputElement.selectionStart === this.inputElement.selectionEnd){
                 this.inputElement.value = this.inputElement.value.slice(0, this.inputElement.selectionStart) + text + this.inputElement.value.slice(this.inputElement.selectionEnd);
                 this.inputElement.selectionStart = this.inputElement.selectionEnd = this.inputElement.selectionStart + text.length;
             } else {
                 this.inputElement.value = this.inputElement.value.slice(0, this.inputElement.selectionStart) + text + this.inputElement.value.slice(this.inputElement.selectionEnd);
                this.inputElement.selectionStart = this.inputElement.selectionEnd = this.inputElement.selectionStart + text.length;
             }
            
       });
    }

    toggleCapsLock() {
        this.capsLock = !this.capsLock;
        this.renderKeyboard();
    }
    openModal(){
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
            selectionStart: this.inputElement.selectionStart,
            selectionEnd: this.inputElement.selectionEnd
        });
         this.redoStack = [];
    }
    
    undo() {
        if (this.undoStack.length > 0) {
            const previousState = this.undoStack.pop();
            this.redoStack.push({
                 value: this.inputElement.value,
                 selectionStart: this.inputElement.selectionStart,
                 selectionEnd: this.inputElement.selectionEnd
            });
             this.inputElement.value = previousState.value;
            this.inputElement.selectionStart = previousState.selectionStart;
            this.inputElement.selectionEnd = previousState.selectionEnd;
        }
    }
     redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
              this.undoStack.push({
                value: this.inputElement.value,
                 selectionStart: this.inputElement.selectionStart,
                selectionEnd: this.inputElement.selectionEnd
             });
             this.inputElement.value = nextState.value;
            this.inputElement.selectionStart = nextState.selectionStart;
            this.inputElement.selectionEnd = nextState.selectionEnd;
        }
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
                (pressedKey === "Delete" && key.textContent === "Delete") ||
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
           }  else  if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
                this.redo();
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
                 } else {
                    this.handleBackspace();
                 }
                event.preventDefault();
            } else if (event.key === "Delete") {
                this.handleDelete();
                event.preventDefault();
            }else if (event.key === "Shift"){
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
                (pressedKey === "Delete" && key.textContent === "Delete") ||
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
            this.inputElement.selectionStart = this.inputElement.value.length;
        });

         this.inputElement.addEventListener('select', () => {
           
         });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new VirtualKeyboard(textInput, keyboard);
});