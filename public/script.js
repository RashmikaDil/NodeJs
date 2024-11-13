document.addEventListener("DOMContentLoaded", () => {
    // Load initial data
    fetch("/api/getData")
        .then(response => response.json())
        .then(data => {
            // Set the initial balance
            document.getElementById("balance").innerText = data.balance;

            // Display the transactions
            const transactionsList = document.getElementById("transactions");
            transactionsList.innerHTML = ""; // Clear existing transactions
            data.transactions.forEach(transaction => {
                const li = document.createElement("li");
                li.textContent = `${transaction.type === "saving" ? "+" : "-"}$${transaction.amount}`;
                transactionsList.appendChild(li);
            });
        })
        .catch(error => console.error("Error loading data:", error));

    // Add transaction event
    document.getElementById("addTransactionBtn").addEventListener("click", () => {
        const amount = parseInt(document.getElementById("amount").value);
        const type = document.getElementById("type").value;

        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        // Send the transaction to the backend
        fetch("/api/addTransaction", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ amount, type })
        })
        .then(response => response.json())
        .then(data => {
            // Update the balance and transactions on the frontend
            document.getElementById("balance").innerText = data.balance;
            const transactionsList = document.getElementById("transactions");
            const li = document.createElement("li");
            li.textContent = `${type === "saving" ? "+" : "-"}$${amount}`;
            transactionsList.appendChild(li);
        })
        .catch(error => console.error("Error adding transaction:", error));
    });
});
