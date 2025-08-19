let componentsData = [];
let componentProperties = {};

fetch("/static/components.json")
  .then((resp) => resp.json())
  .then((data) => {
    componentsData = data;
    const tbody = document
      .getElementById("availableTable")
      .querySelector("tbody");
    data.forEach((c) => {
      const key = `${c.Component}||${c.Source}||${c.Description}`;
      componentProperties[key] = {
        Density: parseFloat(c.Density),
        TotalSulfur: parseFloat(c.TotalSulfur),
        VBN: 14.534 * Math.log(Math.log(parseFloat(c.Viscosity) + 0.8)) + 10.975,
        PP: Math.pow(parseFloat(c.PourPoint) + 273.15, 12.5),
        FP: Math.pow(10, -6.1188 + 2414 / (parseFloat(c.FlashPoint) + 273.15 - 42.6)),
        BGC_noVA: parseFloat(c.BGC-without-VA),
      };
      const row = document.createElement("tr");
      row.innerHTML = `<td><input type="checkbox" class="row-checkbox"></td>
                                     <td>${c.Component}</td>
                                     <td>${c.Source}</td>
                                     <td>${c.Description}</td>
                                     <td>${c.DateModified}</td>`;
      row.addEventListener("dblclick", () => addToSelected(c));
      tbody.appendChild(row);
    });
  });

function addToSelected(comp) {
  const tbody = document.getElementById("selectedTable").querySelector("tbody");
  const key = comp.Component + "|" + comp.Source + "|" + comp.Description;
  // جلوگیری از تکراری
  let exists = false;
  tbody.querySelectorAll("tr").forEach((r) => {
    const cells = r.querySelectorAll("td");
    if (
      cells[1].innerText === comp.Component &&
      cells[2].innerText === comp.Source &&
      cells[3].innerText === comp.Description
    ) {
      exists = true;
    }
  });
  if (exists) return;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `<td><input type="checkbox" class="row-checkbox"></td>
                                <td>${comp.Component}</td>
                                <td>${comp.Source}</td>
                                <td>${comp.Description}</td>
                                <td><input type="number" min="0" value="0" style="width:80px;"></td>`;
  tbody.appendChild(newRow);
  const fractionInput = newRow.querySelector("input[type='number']");
  fractionInput.addEventListener("input", updateFractionWarning);
}

document
  .getElementById("selectAllAvailable")
  .addEventListener("change", function () {
    document
      .querySelectorAll("#availableTable tbody .row-checkbox")
      .forEach((cb) => (cb.checked = this.checked));
  });

document
  .getElementById("selectAllSelected")
  .addEventListener("change", function () {
    document
      .querySelectorAll("#selectedTable tbody .row-checkbox")
      .forEach((cb) => (cb.checked = this.checked));
  });

document.getElementById("addBtn").addEventListener("click", function () {
  document.querySelectorAll("#availableTable tbody tr").forEach((row) => {
    const checkbox = row.querySelector("input[type=checkbox]");
    if (checkbox && checkbox.checked) {
      const cells = row.querySelectorAll("td");
      addToSelected({
        Component: cells[1].innerText,
        Source: cells[2].innerText,
        Description: cells[3].innerText,
      });
      checkbox.checked = false;
    }
  });
  document.getElementById("selectAllAvailable").checked = false;
});

document.getElementById("removeBtn").addEventListener("click", function () {
  document.querySelectorAll("#selectedTable tbody tr").forEach((row) => {
    const checkbox = row.querySelector("input[type=checkbox]");
    if (checkbox && checkbox.checked) row.remove();
  });
  document.getElementById("selectAllSelected").checked = false;

  updateFractionWarning();
});

function calcDensity(fraction, values) {
  let total = 0;
  fraction.forEach((f, i) => (total += 10.0 * f * values[i]));
  return total;
}

// محاسبه
document.getElementById("calculateBtn").addEventListener("click", () => {
  let totalFraction = 0;
  let weightedSumRho = 0;
  let weightedSumTS = 0;
  let weightedSumVBN = 0;
  let weightedSumPPB = 0;
  let weightedSumFPB = 0;
  let weightedBGCNOVA = 0;

  document.querySelectorAll("#selectedTable tbody tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    const compName = cells[1].innerText;
    const source = cells[2].innerText;
    const desc = cells[3].innerText;
    const fraction = parseFloat(cells[4].querySelector("input").value) || 0;

    totalFraction += fraction;
    // const key = `${compName}||${source}||${desc}`;
    // Density[row.index] = componentProperties[key].Density

    const key = `${compName}||${source}||${desc}`;
    if (componentProperties[key]) {
      weightedSumRho += fraction / componentProperties[key].Density;
      weightedSumTS += fraction * componentProperties[key].TotalSulfur;
      weightedSumVBN += fraction * componentProperties[key].VBN;
      weightedSumPPB += fraction * componentProperties[key].PP / componentProperties[key].Density;
      weightedSumFPB += fraction * componentProperties[key].FP / componentProperties[key].Density;
      weightedBGCNOVA += fraction* BGC_noVA
    }
  });

  let mixedDensity = totalFraction / weightedSumRho; //totalFraction ? weightedSum / totalFraction : 0;
  let mixedTotalSulfur = weightedSumTS / totalFraction;
  let mixedvbn = weightedSumVBN / totalFraction;
  let mixedViscosity = Math.exp(Math.exp((mixedvbn - 10.975)/14.534)) - 0.8;
  let mixedPP = mixedDensity * weightedSumPPB / totalFraction;
  let mixedPourPoint = Math.pow(mixedPP, 0.08) - 273.15;
  let mixedFP = mixedDensity * weightedSumFPB / totalFraction;
  let mixedFlashPoint = 2414 / (Math.log10(mixedFP) + 6.1188) + 42.6 - 273.15;
  let mixedbgcva = weightedBGCNOVA / totalFraction;

  const specs = ["Density", "Total Sulfur", "Kinematic Viscosity", "Pour Point", "Flash Point"];
  const values = [
    `${mixedDensity.toFixed(4)} g/cm³`,
    `${mixedTotalSulfur.toFixed(0)} ppm`,
    `${mixedViscosity.toFixed(1)} cSt`,
    `${mixedPourPoint.toFixed(1)} °C`,
    `${mixedFlashPoint.toFixed(2)} °C`
  ];

  document.getElementById("result").innerHTML = `
    <div>
      ${specs.map(s => `<div>${s}</div>`).join("")}
    </div>
    <div>
      ${values.map(v => `<div>${v}</div>`).join("")}
    </div>`;

//   document.getElementById(
//     "result"
//   ).innerText = `Density: ${mixedDensity.toFixed(4)} g/cm³ \n Total Sulfur: ${mixedTotalSulfur.toFixed(0)} ppm \n Kin. Viscosity: ${mixedViscosity.toFixed(1)} cSt \n Pour Point: ${mixedPourPoint.toFixed(1)} degC \n Flash Point: ${mixedFlashPoint.toFixed(2)} degC`;
// });

// تابع ساده برای فیلتر
function filterTable(inputId, tableId, colIndex) {
  const input = document.getElementById(inputId);
  input.addEventListener("keyup", () => {
    const filter = input.value.toLowerCase();
    const rows = document.getElementById(tableId).querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const cell = row.cells[colIndex];
      row.style.display = cell.innerText.toLowerCase().includes(filter)
        ? ""
        : "none";
    });
  });
}

document
  .getElementById("searchAvailable")
  .addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    document.querySelectorAll("#availableTable tbody tr").forEach((row) => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(filter) ? "" : "none";
    });
  });

function addSearchBox(tableId, placeholderText) {
  const tableWrapper = document.getElementById(tableId).parentElement;
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholderText;
  input.classList.add("search-box");
  tableWrapper.prepend(input);

  input.addEventListener("keyup", () => {
    const filter = input.value.toLowerCase();
    const rows = document.getElementById(tableId).querySelectorAll("tbody tr");
    rows.forEach((row) => {
      row.style.display = Array.from(row.cells).some((cell) =>
        cell.innerText.toLowerCase().includes(filter)
      )
        ? ""
        : "none";
    });
  });
}

// اضافه کردن جستجو برای هر جدول
//addSearchBox('availableTable', 'جستجوی Available Components...');
//addSearchBox('selectedTable', 'جستجوی Selected Components...');

// افزودن قابلیت سورت ساده روی هدرها
function makeTableSortable(tableId) {
  const table = document.getElementById(tableId);
  const headers = table.querySelectorAll("th");
  const sortOrder = Array.from(headers).map(() => true); // true = صعودی
  headers.forEach((th, index) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      const tbody = table.querySelector("tbody");
      const rows = Array.from(tbody.querySelectorAll("tr"));
      rows.sort((a, b) => {
        const textA = a.cells[index].innerText.toLowerCase();
        const textB = b.cells[index].innerText.toLowerCase();
        if (textA < textB) return sortOrder[index] ? -1 : 1;
        if (textA > textB) return sortOrder[index] ? 1 : -1;
        return 0;
      });
      rows.forEach((tr) => tbody.appendChild(tr));
      sortOrder[index] = !sortOrder[index]; // معکوس کردن ترتیب برای کلیک بعدی
    });
  });
}

makeTableSortable("availableTable");
//makeTableSortable('selectedTable');

/// SUMFraction
const tbody = document.querySelector("#selectedTable tbody");
const fractionDisplay = document.getElementById("fractionSumDisplay");

// تابع محاسبه و نمایش جمع فرکشن‌ها
function updateFractionWarning() {
  let sum = 0;
  const rows = document.querySelectorAll("#selectedTable tr");
  rows.forEach((row) => {
    const input = row.querySelector("input[type='number']");
    if (input) {
      const f = parseFloat(input.value) || 0;
      sum += f;
    }
  });

  const fractionSumLabel = document.getElementById("fractionSumLabel");
  fractionSumLabel.innerText = "Sum: " + sum.toFixed(2);

  if (Math.abs(sum - 100) < 0.01) {
    fractionSumLabel.style.color = "black";
  } else {
    fractionSumLabel.style.color = "red";
  }
}

// وقتی ردیف جدید اضافه میشه
function addRowToSelected(component, source, description) {
  const tableBody = document.getElementById("selectedTable");

  const row = document.createElement("tr");
  row.innerHTML = `
                    <td><input type="checkbox" class="rowCheckbox"></td>
                    <td>${component}</td>
                    <td>${source}</td>
                    <td>${description}</td>
                    <td><input type="number" value="0" min="0" max="100" step="0.01"></td>
                `;

  const fractionInput = row.querySelector("input[type='number']");
  fractionInput.addEventListener("input", updateFractionWarning);

  tableBody.appendChild(row);
  updateFractionWarning();
}

// وقتی ردیفی حذف میشه
function removeSelectedRows() {
  const rows = document.querySelectorAll("#selectedTable tr");
  rows.forEach((row) => {
    const checkbox = row.querySelector("input[type='checkbox']");
    if (checkbox && checkbox.checked) {
      row.remove();
    }
  });
  updateFractionWarning();
}

updateFractionWarning();









