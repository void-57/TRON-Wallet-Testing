// transactionHistory.js

const options = { method: "GET", headers: { accept: "application/json" } };
let nextUrl = null;

async function transactionHistory(url, address) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    const historyDiv = document.getElementById("historyOutput");
     historyDiv.innerHTML = ""; 
    if (data && data.data) {
      data.data.forEach((tx) => {
        const hash = tx.txID;
        const block = tx.blockNumber;
        const age = new Date(tx.block_timestamp).toLocaleString();
        const type = tx.raw_data.contract[0].type;
        const from = tronWeb.address.fromHex(
          tx.raw_data.contract[0].parameter.value.owner_address
        );
        const to = tronWeb.address.fromHex(
          tx.raw_data.contract[0].parameter.value.to_address
        );
        const amount =
          tx.raw_data.contract[0].parameter.value.amount / 1e6 + " TRX";
        const result = tx.ret[0].contractRet;

        // status color
        const statusColor = result === "SUCCESS" ? "green" : "red";

        // create card
        const card = document.createElement("div");
        card.className = "tx-card";

        card.innerHTML = `
          <p><b>Hash:</b> ${truncate(hash)} 
            <button onclick="copyToClipboard('${hash}')"><i class="fas fa-copy"></i></button></p>
          <p><b>Block:</b> ${block}</p>
          <p><b>Age:</b> ${age}</p>
          <p><b>Type:</b> ${type}</p>
          <p><b>From:</b> ${(from)} 
            <button onclick="copyToClipboard('${from}')"><i class="fas fa-copy"></i></button></p>
          <p><b>To:</b> ${(to)} 
            <button onclick="copyToClipboard('${to}')"><i class="fas fa-copy"></i></button></p>
          <p><b>Amount:</b> <span style="color:#0f0;font-weight:bold">${amount}</span></p>
          <p><b>Status:</b> <span style="color:${statusColor}">${result}</span></p>
        `;

        historyDiv.appendChild(card);
      });

      // save nextUrl for pagination
      if (data.meta && data.meta.fingerprint) {
        nextUrl = `https://api.shasta.trongrid.io/v1/accounts/${address}/transactions?limit=10&fingerprint=${encodeURIComponent(
          data.meta.fingerprint
        )}`;
      } else {
        nextUrl = null;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function fetchNext(address) {
  if (nextUrl) {
    transactionHistory(nextUrl, address);
  }
}

// Helpers
function truncate(str, len = 12) {
  if (!str) return "";
  return str.length > len ? str.slice(0, 6) + "..." + str.slice(-6) : str;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied: " + text);
  });
}
