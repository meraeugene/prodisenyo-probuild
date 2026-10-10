const fs = require("node:fs");
const path = require("node:path");
module.exports = {
  name: "workspace-offline-actions",
  setup(build) {
    build.onResolve({ filter: /^@\/actions\// }, (args) => ({ path: args.path, namespace: "workspace-actions" }));
    build.onLoad({ filter: /.*/, namespace: "workspace-actions" }, (args) => {
      const source = fs.readFileSync(path.join(process.cwd(), args.path.replace("@/", "") + ".ts"), "utf8");
      const reads = { getHistoricalRentalIncomeAction: "window.__historicalIncome || []", getGmeaProjectsDataAction: "window.__gmeaProjects", getGmeaProjectDataAction: "null", getGmeaRentalEquipmentAction: "window.__equipment", getGmeaRentalsAction: "window.__rentals", getGmeaRentalOperationsAction: "window.__rentalOperations", getPurchasingRecordsAction: "window.__purchases" };
      const contents = [...source.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map((match) =>
        `export async function ${match[1]}(){${reads[match[1]] ? `return ${reads[match[1]]}` : 'throw new Error("Mutation disabled in offline UI check")'}}`,
      ).join("\n");
      return { loader: "js", contents };
    });
  },
};
