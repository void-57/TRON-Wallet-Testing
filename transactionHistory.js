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
      console.log(data.data);

      data.data.forEach((tx) => {
        const hash = tx.txID;
        const block = tx.blockNumber;
        const age = new Date(tx.block_timestamp).toLocaleString();
        const type = tx.raw_data.contract[0].type;

        let from = "";
        let to = "";
        let amount = "";
        let extraContractLine = ""; // for TriggerSmartContract

        if (type === "TransferContract") {
          // ------- Native TRX transfer -------
          const v = tx.raw_data.contract[0].parameter.value;
          from = tronWeb.address.fromHex(v.owner_address);
          to = tronWeb.address.fromHex(v.to_address);
          amount = v.amount / 1e6 + " TRX";
        } else if (type === "TriggerSmartContract") {
          // ------- TRC20 token transfer (contract call) -------
          const v = tx.raw_data.contract[0].parameter.value;

          // Sender (owner) in TRON hex already
          from = tronWeb.address.fromHex(v.owner_address);

          // Contract address (TRC20 token contract)
          const contractBase58 = tronWeb.address.fromHex(v.contract_address);
          extraContractLine = `
            <p><b>Contract:</b> ${contractBase58}
              <button onclick="copyToClipboard('${contractBase58}')"><i class="fas fa-copy"></i></button>
            </p>`;

          // DATA decoding: 0xa9059cbb + 32B addr + 32B amount
         
          const input = (v.data || "").startsWith("0x") ? v.data.slice(2) : (v.data || "");
          const method = input.slice(0, 8).toLowerCase();

          if (method === "a9059cbb" && input.length >= 8 + 64 + 64) {
            const addrSlot = input.slice(8, 8 + 64);
            const amountSlot = input.slice(8 + 64, 8 + 64 + 64);

            // last 40 hex chars of addrSlot = 20-byte EVM address
            const evmAddrHex = addrSlot.slice(24);
            // convert to TRON hex (prefix 0x41)
            const tronHex = "41" + evmAddrHex.toLowerCase();
            to = tronWeb.address.fromHex(tronHex);

            
            const raw = BigInt("0x" + amountSlot);
            amount = Number(raw) / 1e6 + " USDT";
          } else {
           
            to = "—";
            amount = "—";
          }
        }

        const result = tx.ret?.[0]?.contractRet || "UNKNOWN";
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
          <p><b>From:</b> ${from}
            <button onclick="copyToClipboard('${from}')"><i class="fas fa-copy"></i></button></p>
          <p><b>To:</b> ${to}
            <button onclick="copyToClipboard('${to}')"><i class="fas fa-copy"></i></button></p>
          ${extraContractLine}
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
