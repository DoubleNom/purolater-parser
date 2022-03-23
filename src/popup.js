let fAddress = document.getElementById("faddress")
fAddress.addEventListener("change", async e => {
    chrome.runtime.sendMessage({raw: e.target.value})
})

