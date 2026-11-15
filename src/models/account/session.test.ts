// Tests de la durée des sessions client : node --test src/models/account/session.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { IDLE_DAYS, MAX_DAYS, readTimes, seenLongAgo, sessionExpired } from "./session.ts";

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;

test("une visite récente garde la session", () => {
  assert.equal(sessionExpired({ signedInAt: NOW - 10 * DAY, lastSeen: NOW - DAY }, NOW), false);
  assert.equal(sessionExpired({ signedInAt: NOW - DAY, lastSeen: NOW - IDLE_DAYS * DAY }, NOW), false);
});

test("trop longtemps sans visite : session finie", () => {
  assert.equal(sessionExpired({ signedInAt: NOW - 40 * DAY, lastSeen: NOW - (IDLE_DAYS + 1) * DAY }, NOW), true);
});

test("durée maximale : session finie même avec des visites tous les jours", () => {
  assert.equal(sessionExpired({ signedInAt: NOW - (MAX_DAYS + 1) * DAY, lastSeen: NOW }, NOW), true);
});

test("une session sans dates, ou avec une date illisible, commence maintenant", () => {
  assert.deepEqual(readTimes({}, NOW), { signedInAt: NOW, lastSeen: NOW });
  assert.deepEqual(readTimes({ signedInAt: "hier", lastSeen: NOW + DAY }, NOW), { signedInAt: NOW, lastSeen: NOW });
  assert.deepEqual(readTimes({ signedInAt: NOW - DAY, lastSeen: NOW - 2 }, NOW), { signedInAt: NOW - DAY, lastSeen: NOW - 2 });
});

test("la dernière visite se note au plus une fois par heure", () => {
  assert.equal(seenLongAgo({ signedInAt: NOW, lastSeen: NOW - 60_000 }, NOW), false);
  assert.equal(seenLongAgo({ signedInAt: NOW, lastSeen: NOW - 2 * 3_600_000 }, NOW), true);
});
