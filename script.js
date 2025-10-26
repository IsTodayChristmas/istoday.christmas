const timeZone = "America/New_York";

const getDateTimeFormatter = (() => {
  const cache = new Map();

  return (zone) => {
    if (!cache.has(zone)) {
      cache.set(
        zone,
        new Intl.DateTimeFormat("en-US", {
          timeZone: zone,
          hour12: false,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }

    return cache.get(zone);
  };
})();

const getZonedParts = (date, zone) => {
  const formatter = getDateTimeFormatter(zone);
  const parts = formatter.formatToParts(date);
  const mapped = {};

  for (const { type, value } of parts) {
    if (type !== "literal") {
      mapped[type] = value;
    }
  }

  return mapped;
};

const getTimeZoneOffset = (date, zone) => {
  const mapped = getZonedParts(date, zone);

  const asUTC = Date.UTC(
    Number(mapped.year),
    Number(mapped.month) - 1,
    Number(mapped.day),
    Number(mapped.hour),
    Number(mapped.minute),
    Number(mapped.second)
  );

  return asUTC - date.getTime();
};

const getYearInZone = (date, zone) => {
  const mapped = getZonedParts(date, zone);
  return Number(mapped.year);
};

const getTargetDate = (baseYear) => {
  const approxUTC = new Date(Date.UTC(baseYear, 10, 1, 0, 0, 0));
  const offset = getTimeZoneOffset(approxUTC, timeZone);
  return new Date(approxUTC.getTime() - offset);
};

const getNextTargetDate = () => {
  const now = new Date();
  const year = getYearInZone(now, timeZone);
  let target = getTargetDate(year);

  if (now >= target) {
    target = getTargetDate(year + 1);
  }

  return target;
};

const pad = (value) => value.toString().padStart(2, "0");

const formatUnit = (value, label, shouldPad) => {
  const numeric = shouldPad ? pad(value) : value.toLocaleString("en-US");
  return `${numeric} ${label}${value === 1 ? "" : "s"}`;
};

document.addEventListener("DOMContentLoaded", () => {
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) return;

  let target = getNextTargetDate();

  const updateCountdown = () => {
    const now = new Date();
    const mappedNow = getZonedParts(now, timeZone);
    let diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      const isEventDay =
        Number(mappedNow.month) === 11 && Number(mappedNow.day) === 1;

      if (isEventDay) {
        countdownEl.textContent = "0 days 00 hours 00 minutes 00 seconds";
        return;
      }

      target = getTargetDate(getYearInZone(now, timeZone) + 1);
      diff = target.getTime() - now.getTime();
    }

    const totalSeconds = Math.floor(diff / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);

    const daysText = formatUnit(days, "day", false);
    const hoursText = formatUnit(hours, "hour", true);
    const minutesText = formatUnit(minutes, "minute", true);
    const secondsText = formatUnit(seconds, "second", true);

    countdownEl.textContent = `${daysText} ${hoursText} ${minutesText} ${secondsText}`;
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);
});
