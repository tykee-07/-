(() => {
  const display = document.getElementById('display');
  const keyboard = document.querySelector('.keyboard.calc');

  let firstValue = null;
  let operator = null;
  let waitingForSecond = false;

  const operations = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '×': (a, b) => a * b,
    '÷': (a, b) => b === 0 ? NaN : a / b,
  };

  function updateDisplay(value) {
    display.value = String(value);
  }

  function inputDigit(digit) {
    if (waitingForSecond) {
      updateDisplay(digit);
      waitingForSecond = false;
    } else {
      updateDisplay(display.value === '0' ? digit : display.value + digit);
    }
  }

  function inputDecimal() {
    if (waitingForSecond) {
      updateDisplay('0.');
      waitingForSecond = false;
      return;
    }
    if (!display.value.includes('.')) {
      updateDisplay(display.value + '.');
    }
  }

  function clearAll() {
    firstValue = null;
    operator = null;
    waitingForSecond = false;
    updateDisplay('0');
  }

  function backspace() {
    if (waitingForSecond) return;
    if (display.value.length === 1) updateDisplay('0');
    else updateDisplay(display.value.slice(0, -1));
  }

  function togglePlusMinus() {
    if (display.value === '0') return;
    if (display.value.startsWith('-')) updateDisplay(display.value.slice(1));
    else updateDisplay('-' + display.value);
  }

  function percent() {
    const val = parseFloat(display.value);
    updateDisplay(String(val / 100));
  }

  function handleOperator(nextOp) {
    const inputValue = parseFloat(display.value);
    if (operator && !waitingForSecond) {
      const result = operations[operator](firstValue, inputValue);
      updateDisplay(String(isNaN(result) ? 'Error' : trimResult(result)));
      firstValue = isNaN(result) ? null : result;
    } else {
      firstValue = inputValue;
    }
    waitingForSecond = true;
    operator = nextOp;
  }

  function trimResult(n) {
    return Number.isInteger(n) ? n : parseFloat(n.toFixed(10));
  }

  function calculate() {
    if (!operator || firstValue === null) return;
    const second = parseFloat(display.value);
    const result = operations[operator](firstValue, second);
    updateDisplay(String(isNaN(result) ? 'Error' : trimResult(result)));
    firstValue = null;
    operator = null;
    waitingForSecond = false;
  }

  keyboard.addEventListener('click', (e) => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    const key = btn.dataset.key;
    const action = btn.dataset.action;

    if (action) {
      switch (action) {
        case 'clear': clearAll(); break;
        case 'backspace': backspace(); break;
        case 'equals': calculate(); break;
        case 'plusminus': togglePlusMinus(); break;
        case 'percent': percent(); break;
      }
      if (action !== 'equals' && action !== 'clear') logDisplay(action);
      return;
    }

    if (btn.classList.contains('operator')) {
      handleOperator(key);
      return;
    }

    if (key === '.') { inputDecimal(); return; }
    if (/^\d$/.test(key)) { inputDigit(key); return; }
  });

  // History handling with localStorage persistence
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const STORAGE_KEY = 'calc_history_v1';
  let history = [];

  function timeNow() { return new Date().toLocaleTimeString(); }

  function saveHistory() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (e) {} }

  function renderHistory() {
    historyList.innerHTML = '';
    history.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="val">${item.text}</span><span class="time">${item.time}</span>`;
      historyList.appendChild(li);
    });
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) history = parsed;
    } catch (e) { history = []; }
    renderHistory();
  }

  function logDisplay(action) {
    const entry = { text: display.value, time: timeNow() };
    history.unshift(entry);
    saveHistory();
    renderHistory();
  }

  function logCalculation(a, op, b, result) {
    const entry = { text: `${a} ${op} ${b} = ${result}`, time: timeNow() };
    history.unshift(entry);
    saveHistory();
    renderHistory();
  }

  clearHistoryBtn.addEventListener('click', () => { history = []; saveHistory(); renderHistory(); });

  function calculate() {
    if (!operator || firstValue === null) return;
    const second = parseFloat(display.value);
    const result = operations[operator](firstValue, second);
    const final = String(isNaN(result) ? 'Error' : trimResult(result));
    updateDisplay(final);
    logCalculation(firstValue, operator, second, final);
    firstValue = null;
    operator = null;
    waitingForSecond = false;
  }

  // allow clicking history items to reuse the value/result
  historyList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const valSpan = li.querySelector('.val');
    if (!valSpan) return;
    const text = valSpan.textContent.trim();
    const eq = text.lastIndexOf('=');
    let toSet = eq !== -1 ? text.slice(eq + 1).trim() : text;
    const num = parseFloat(toSet.replace(',', '.'));
    if (!isNaN(num)) {
      updateDisplay(String(num));
      firstValue = null; operator = null; waitingForSecond = false;
    } else {
      updateDisplay(toSet);
      firstValue = null; operator = null; waitingForSecond = false;
    }
  });

  // load saved history on start
  loadHistory();

  clearAll();
})();
