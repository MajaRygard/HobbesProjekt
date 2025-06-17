document.getElementById("processBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("pdfFile");
    const feedback = document.getElementById("feedback");
  
    if (!fileInput.files.length) {
      feedback.textContent = "Please select a PDF file.";
      return;
    }
  
    const file = fileInput.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
  
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(" ");
      fullText += pageText + " ";
    }
  
    // Step 1: Match all RT entries and extract following info
    const rtPattern = /RT\s+(\w+)\s+(\d{4}(?:[+-]\d)?)\s+\d{4}(?:[+-]\d)?\s+\w+\s+(\d{4}(?:[+-]\d)?)/g;
    const matches = [...fullText.matchAll(rtPattern)];
  
    let results = [];
    let rtCount = matches.length;

    let TotalNoTaxMoney = 0

    console.log("Innan loopen")
  
    for (const match of matches) {
        
        const location = match[1];
        const startTimeStr = match[2];
        const endTimeStr = match[3];
      
        // Map location to value
        let locationValue = 0; // Default Dannmark
        if (location === "ARN") locationValue = 1; // Sverige
        else if (location === "KRS") locationValue = 2; // Norge
        else if (location === "HAM" || location === "HAJ") locationValue = 2; // Tyskland
      
        // Helper to extract hours/minutes and offset (+1, -1, or 0)
        const parseTimeDaysIncluded = (timeStr) => {
          const time = timeStr.slice(0, 4);
          const offset = timeStr.includes("+1") ? 1 : timeStr.includes("-1") ? -1 : 0;
          const hour = parseInt(time.substring(0, 2), 10);
          const min = parseInt(time.substring(2, 4), 10);
          return { totalMin: hour * 60 + min + offset * 1440 };
        };

        const parseTime = (timeStr) => {
            const time = timeStr.slice(0, 4);          // Tar alltid de första 4 tecknen (HHMM)
            const hour = parseInt(time.substring(0, 2), 10);
            const min = parseInt(time.substring(2, 4), 10);
            return { totalMin: hour * 60 + min };      // Ignorerar +1 eller -1 helt
          };
    
        const start = parseTime(startTimeStr);
        const end = parseTime(endTimeStr);

        console.log(start)
        
        const resultTraktamenten = howManyTraktamenten(start, end)

        const NoTaxSalary = HowMuchTaxMoneyThatDay(resultTraktamenten.helaTraktamenten, resultTraktamenten.halvaTraktamenten, locationValue)

        TotalNoTaxMoney = TotalNoTaxMoney + NoTaxSalary
      
        results.push(`Hela traktamenten ${resultTraktamenten.helaTraktamenten}, halva traktamenten ${resultTraktamenten.halvaTraktamenten}, "Land", ${locationValue}, Summa, ${NoTaxSalary} `);
      }

      function HowMuchTaxMoneyThatDay(hela, halva, place) {
        let noTax = 0;
      
        if (place === 0) noTax = 1268 * hela + 634 * halva;
        else if (place === 1) noTax = 290 * hela + 145 * halva;
        else if (place === 2) noTax = 1095 * hela + 547.5 * halva;
        else if (place === 3) noTax = 774 * hela + 387 * halva;
      
        return noTax;
      }
      

      function howManyTraktamenten(start, end) {
        let helaTraktamenten = 0
        let halvaTraktamenten = 0
        if (start.totalMin < 720) helaTraktamenten = helaTraktamenten + 1 
        if (start.totalMin >= 720) halvaTraktamenten = halvaTraktamenten +1
        if (end.totalMin > 1140) helaTraktamenten = helaTraktamenten +1
        if (end.totalMin <= 1140) halvaTraktamenten = halvaTraktamenten +1

        return { helaTraktamenten, halvaTraktamenten }
      }
  
    // Output results
    console.log(TotalNoTaxMoney)
    feedback.innerHTML = `Total Tax Free Money Traktamenten: ${TotalNoTaxMoney}<br><br>Detaljer:<br>` + results.join("<br>");


  });
  