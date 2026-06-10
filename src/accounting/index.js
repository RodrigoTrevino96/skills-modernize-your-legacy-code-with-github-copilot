"use strict";

function formatAmount(value) {
  return Number(value).toFixed(2);
}

function createAccountingApp(options = {}) {
  const readLine = options.readLine || (() => "");
  const writeLine = options.writeLine || (() => {});
  let storageBalance = Number.isFinite(options.initialBalance) ? options.initialBalance : 1000.0;

  function dataProgramExecute(operation, balance) {
    if (operation === "READ") {
      return storageBalance;
    }

    if (operation === "WRITE") {
      storageBalance = balance;
      return storageBalance;
    }

    return storageBalance;
  }

  function acceptAmount(label) {
    while (true) {
      const raw = String(readLine(label)).trim();
      const parsed = Number(raw);

      if (!Number.isFinite(parsed) || parsed < 0) {
        writeLine("Invalid amount. Please enter a non-negative number.");
        continue;
      }

      return parsed;
    }
  }

  function operations(passedOperation) {
    const operationType = String(passedOperation).trim();
    let amount = 0;
    let finalBalance = 1000.0;

    if (operationType === "TOTAL") {
      finalBalance = dataProgramExecute("READ", finalBalance);
      writeLine(`Current balance: ${formatAmount(finalBalance)}`);
    } else if (operationType === "CREDIT") {
      amount = acceptAmount("Enter credit amount: ");
      finalBalance = dataProgramExecute("READ", finalBalance);
      finalBalance += amount;
      dataProgramExecute("WRITE", finalBalance);
      writeLine(`Amount credited. New balance: ${formatAmount(finalBalance)}`);
    } else if (operationType === "DEBIT") {
      amount = acceptAmount("Enter debit amount: ");
      finalBalance = dataProgramExecute("READ", finalBalance);

      if (finalBalance >= amount) {
        finalBalance -= amount;
        dataProgramExecute("WRITE", finalBalance);
        writeLine(`Amount debited. New balance: ${formatAmount(finalBalance)}`);
      } else {
        writeLine("Insufficient funds for this debit.");
      }
    }
  }

  function printMenu() {
    writeLine("--------------------------------");
    writeLine("Account Management System");
    writeLine("1. View Balance");
    writeLine("2. Credit Account");
    writeLine("3. Debit Account");
    writeLine("4. Exit");
    writeLine("--------------------------------");
  }

  function processMenuChoice(userChoice) {
    switch (userChoice) {
      case 1:
        operations("TOTAL ");
        return true;
      case 2:
        operations("CREDIT");
        return true;
      case 3:
        operations("DEBIT ");
        return true;
      case 4:
        return false;
      default:
        writeLine("Invalid choice, please select 1-4.");
        return true;
    }
  }

  function runMainLoop() {
    let continueFlag = true;

    while (continueFlag) {
      printMenu();
      const choiceRaw = String(readLine("Enter your choice (1-4): ")).trim();
      const userChoice = Number.parseInt(choiceRaw, 10);
      continueFlag = processMenuChoice(userChoice);
    }

    writeLine("Exiting the program. Goodbye!");
  }

  return {
    operations,
    processMenuChoice,
    printMenu,
    runMainLoop,
    dataProgramExecute,
    getBalance: () => dataProgramExecute("READ", 0),
    setBalance: (value) => dataProgramExecute("WRITE", value)
  };
}

function createCliApp() {
  const prompt = require("prompt-sync")({ sigint: true });

  return createAccountingApp({
    readLine: (label) => prompt(label),
    writeLine: (text) => console.log(text),
    initialBalance: 1000.0
  });
}

if (require.main === module) {
  createCliApp().runMainLoop();
}

module.exports = {
  createAccountingApp,
  formatAmount
};
