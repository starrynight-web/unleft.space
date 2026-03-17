import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as d3 from "d3";

const inputPath = path.resolve("public/assets/data/world-land.json");
const outputDirectory = path.resolve("public/assets/data");

const outputPresets = [
  { name: "desktop", filename: "world-dots-desktop.json", step: 1.8 },
  { name: "mobile", filename: "world-dots-mobile.json", step: 3.2 },
];

function pointInPolygon([x, y], polygon) {
  let inside = false;

  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index++
  ) {
    const [currentX, currentY] = polygon[index];
    const [previousX, previousY] = polygon[previous];
    const crosses =
      currentY > y !== previousY > y &&
      x <
        ((previousX - currentX) * (y - currentY)) /
          (previousY - currentY) +
          currentX;

    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInFeature(point, feature) {
  const { geometry } = feature;

  if (geometry.type === "Polygon") {
    const [outer, ...holes] = geometry.coordinates;
    if (!pointInPolygon(point, outer)) {
      return false;
    }

    return !holes.some((hole) => pointInPolygon(point, hole));
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => {
      const [outer, ...holes] = polygon;
      if (!pointInPolygon(point, outer)) {
        return false;
      }

      return !holes.some((hole) => pointInPolygon(point, hole));
    });
  }

  return false;
}

function roundCoordinate(value) {
  return Number(value.toFixed(2));
}

function generateDots(featureCollection, step) {
  const points = [];

  for (const feature of featureCollection.features) {
    const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] =
      d3.geoBounds(feature);

    for (
      let longitude = minLongitude;
      longitude <= maxLongitude;
      longitude += step
    ) {
      for (
        let latitude = minLatitude;
        latitude <= maxLatitude;
        latitude += step
      ) {
        if (pointInFeature([longitude, latitude], feature)) {
          points.push(roundCoordinate(longitude), roundCoordinate(latitude));
        }
      }
    }
  }

  return points;
}

async function main() {
  const worldLand = JSON.parse(await readFile(inputPath, "utf8"));

  await mkdir(outputDirectory, { recursive: true });

  for (const preset of outputPresets) {
    const startedAt = performance.now();
    const points = generateDots(worldLand, preset.step);
    const outputPath = path.join(outputDirectory, preset.filename);

    await writeFile(
      outputPath,
      `${JSON.stringify({ step: preset.step, points }, null, 2)}\n`,
    );

    const duration = Math.round(performance.now() - startedAt);
    console.log(
      `${preset.name}: wrote ${points.length / 2} dots to ${path.relative(process.cwd(), outputPath)} in ${duration}ms`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
