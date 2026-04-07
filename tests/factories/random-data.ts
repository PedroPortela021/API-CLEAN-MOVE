import { randomInt as cryptoRandomInt, randomUUID } from "node:crypto";

function randomToken(length = 8) {
  return randomUUID().replace(/-/g, "").slice(0, length);
}

function randomDigits(length: number) {
  return Array.from({ length }, () => cryptoRandomInt(0, 10)).join("");
}

export function randomBoolean() {
  return cryptoRandomInt(0, 2) === 1;
}

export function randomIntInclusive(min: number, max: number) {
  return cryptoRandomInt(min, max + 1);
}

export function makeCompanyName() {
  return `Company ${randomToken(8)}`;
}

export function makeUsername() {
  return `user_${randomToken(8)}`;
}

export function makeProductName() {
  return `Service ${randomToken(6)}`;
}

export function makeProductDescription() {
  return `Description ${randomToken(12)}`;
}

export function makeFullName() {
  return `User ${randomToken(6)}`;
}

export function makeCity() {
  return `City ${randomToken(5)}`;
}

export function makeCountry() {
  return "Brazil";
}

export function makeState() {
  return "Sao Paulo";
}

export function makeStreet() {
  return `Street ${randomToken(5)}, ${randomIntInclusive(1, 9999)}`;
}

export function makeZipCode() {
  return `${randomDigits(5)}-${randomDigits(3)}`;
}

export function makeEmail() {
  return `user.${randomToken(10)}@example.com`;
}

export function makePassword() {
  return `Pass_${randomToken(12)}!`;
}
