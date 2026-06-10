"use strict";

const { createAccountingApp } = require("./index");

function createHarness(inputs = [], initialBalance = 1000.0) {
  const queue = [...inputs];
  const outputs = [];
  const prompts = [];

  const app = createAccountingApp({
    initialBalance,
    readLine: (label) => {
      prompts.push(label);
      return queue.length > 0 ? queue.shift() : "";
    },
    writeLine: (line) => outputs.push(String(line))
  });

  return { app, outputs, prompts };
}

describe("COBOL parity test plan", () => {
  test("TC-001 displays main menu on startup", () => {
    const { app, outputs, prompts } = createHarness(["4"]);

    app.runMainLoop();

    expect(outputs).toEqual(
      expect.arrayContaining([
        "Account Management System",
        "1. View Balance",
        "2. Credit Account",
        "3. Debit Account",
        "4. Exit"
      ])
    );
    expect(prompts).toContain("Enter your choice (1-4): ");
  });

  test("TC-002 shows initial balance", () => {
    const { app, outputs } = createHarness();

    app.operations("TOTAL ");

    expect(outputs).toContain("Current balance: 1000.00");
  });

  test("TC-003 credits account and updates balance", () => {
    const { app, outputs } = createHarness(["500.00"]);

    app.operations("CREDIT");
    app.operations("TOTAL ");

    expect(outputs).toContain("Amount credited. New balance: 1500.00");
    expect(outputs).toContain("Current balance: 1500.00");
  });

  test("TC-004 debits account with sufficient funds", () => {
    const { app, outputs } = createHarness(["200.00"]);

    app.operations("DEBIT ");

    expect(outputs).toContain("Amount debited. New balance: 800.00");
    expect(app.getBalance()).toBe(800);
  });

  test("TC-005 rejects debit with insufficient funds", () => {
    const { app, outputs } = createHarness(["2000.00"]);

    app.operations("DEBIT ");

    expect(outputs).toContain("Insufficient funds for this debit.");
    expect(app.getBalance()).toBe(1000);
  });

  test("TC-006 handles invalid menu choice", () => {
    const { app, outputs } = createHarness();

    const keepRunning = app.processMenuChoice(9);

    expect(keepRunning).toBe(true);
    expect(outputs).toContain("Invalid choice, please select 1-4.");
  });

  test("TC-007 exits when option 4 is selected", () => {
    const { app, outputs } = createHarness(["4"]);

    app.runMainLoop();

    expect(outputs).toContain("Exiting the program. Goodbye!");
  });

  test("TC-008 persists balance across multiple operations in same run", () => {
    const { app, outputs } = createHarness(["100.00", "50.00"]);

    app.operations("CREDIT");
    app.operations("DEBIT ");
    app.operations("TOTAL ");

    expect(app.getBalance()).toBe(1050);
    expect(outputs).toContain("Current balance: 1050.00");
  });

  test("TC-009 resets balance on application restart", () => {
    const runA = createHarness(["250.00"]);
    runA.app.operations("CREDIT");
    expect(runA.app.getBalance()).toBe(1250);

    const runB = createHarness();
    runB.app.operations("TOTAL ");

    expect(runB.outputs).toContain("Current balance: 1000.00");
  });

  test("TC-010 allows debit exactly equal to current balance", () => {
    const { app, outputs } = createHarness(["1000.00"]);

    app.operations("DEBIT ");
    app.operations("TOTAL ");

    expect(outputs).toContain("Amount debited. New balance: 0.00");
    expect(outputs).toContain("Current balance: 0.00");
  });

  test("TC-011 accepts zero credit amount and keeps balance unchanged", () => {
    const { app, outputs } = createHarness(["0.00"]);

    app.operations("CREDIT");
    app.operations("TOTAL ");

    expect(outputs).toContain("Amount credited. New balance: 1000.00");
    expect(outputs).toContain("Current balance: 1000.00");
  });

  test("TC-012 accepts zero debit amount and keeps balance unchanged", () => {
    const { app, outputs } = createHarness(["0.00"]);

    app.operations("DEBIT ");
    app.operations("TOTAL ");

    expect(outputs).toContain("Amount debited. New balance: 1000.00");
    expect(outputs).toContain("Current balance: 1000.00");
  });

  test("TC-013 rejects negative amount and reprompts for valid value", () => {
    const { app, outputs } = createHarness(["-10.00", "10.00"]);

    app.operations("CREDIT");

    expect(outputs).toContain("Invalid amount. Please enter a non-negative number.");
    expect(outputs).toContain("Amount credited. New balance: 1010.00");
  });

  test("TC-014 keeps decimal precision to two places", () => {
    const { app, outputs } = createHarness(["10.55", "0.55"]);

    app.operations("CREDIT");
    app.operations("DEBIT ");
    app.operations("TOTAL ");

    expect(outputs).toContain("Amount credited. New balance: 1010.55");
    expect(outputs).toContain("Amount debited. New balance: 1010.00");
    expect(outputs).toContain("Current balance: 1010.00");
  });

  test("TC-015 supports high boundary amount scenario", () => {
    const { app, outputs } = createHarness(["999999.99"], 0);

    app.operations("CREDIT");
    app.operations("TOTAL ");

    expect(outputs).toContain("Amount credited. New balance: 999999.99");
    expect(outputs).toContain("Current balance: 999999.99");
  });
});
