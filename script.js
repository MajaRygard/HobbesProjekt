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
  
    // Hitta alla ställen där det står RT eller SPLIT och infon som står efter på raden
    // const rtPattern = /RT\s+(\w+)\s+(\d{4}(?:[+-]\d)?)\s+\d{4}(?:[+-]\d)?\s+\w+\s+(\d{4}(?:[+-]\d)?)/g;
    //const rtPattern = /(?:RT|SPLIT)\s+(\w+)\s+(\d{4}(?:[+-]\d)?)\s+\d{4}(?:[+-]\d)?\s+\w+\s+(\d{4}(?:[+-]\d)?)/g;
    const rtPattern = /(RT|SPLIT)\s+(\w+)\s+(\d{4}(?:[+-]\d)?)\s+\d{4}(?:[+-]\d)?\s+\w+\s+(\d{4}(?:[+-]\d)?)/g;


    const matches = [...fullText.matchAll(rtPattern)];
  
    let results = [];

    let TotalNoTaxMoney = 0
  
    for (const match of matches) {
        const typeOfStop = match[1]
        
        const location = match[2];
        const startTimeStr = match[3];
        const endTimeStr = match[4];
      
        // Map location to value
        let locationValue = 0; // Default Dannmak
        let locationName = "Danmark"
        if (location === "ARN") {locationValue = 1; locationName="Sverige"} // Sverige
        else if (location === "KRS") {locationValue = 2; locationName= "Norge"} // Norge
        else if (location === "HAM" || location === "HAJ") {locationValue = 3; locationName="Tyskland"} // Tyskland


        const parseTime = (timeStr) => {
            const time = timeStr.slice(0, 4); // Get HHMM part
            const hour = parseInt(time.substring(0, 2), 10);
            const min = parseInt(time.substring(2, 4), 10);
            const oneDay = timeStr.includes("+1") || timeStr.includes("-1");
            return { totalMin: hour * 60 + min, oneDay };
          };
    
        const start = parseTime(startTimeStr);
        const end = parseTime(endTimeStr);
        const oneday = !start.oneDay && !end.oneDay;

        
        let resultTraktamenten = 0

        if (typeOfStop === "SPLIT") resultTraktamenten = { helaTraktamenten: 0, halvaTraktamenten: 1 }
        else if (oneday) resultTraktamenten = howManyTraktamentenOneDay(start, end)
        else resultTraktamenten = howManyTraktamenten(start, end)

        const NoTaxSalary = HowMuchTaxMoneyThatDay(resultTraktamenten.helaTraktamenten, resultTraktamenten.halvaTraktamenten, locationValue)

        TotalNoTaxMoney = TotalNoTaxMoney + NoTaxSalary
      
        results.push(`Typ ${typeOfStop}, Hela TK ${resultTraktamenten.helaTraktamenten}, Halva TK ${resultTraktamenten.halvaTraktamenten}, Land ${locationName}, Summa ${NoTaxSalary} `);
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
        else if (start.totalMin >= 720) halvaTraktamenten = halvaTraktamenten +1
        if(end.totalMin > 1140) helaTraktamenten = helaTraktamenten +1
        else if (end.totalMin <= 1140) halvaTraktamenten = halvaTraktamenten +1

        return { helaTraktamenten, halvaTraktamenten }
      }

      function howManyTraktamentenOneDay(start, end) {
        let helaTraktamenten = 0
        let halvaTraktamenten = 0
        if (start.totalMin < 720) helaTraktamenten = helaTraktamenten + 1 
        else if (end.totalMin > 1140) helaTraktamenten = helaTraktamenten +1
        else if (start.totalMin >= 720) halvaTraktamenten = halvaTraktamenten +1
        else if (end.totalMin <= 1140) halvaTraktamenten = halvaTraktamenten +1

        return { helaTraktamenten, halvaTraktamenten }
      }
  
    // Output results
    console.log(TotalNoTaxMoney)
    feedback.innerHTML = `Total Skattefria Pengar Traktamenten: ${TotalNoTaxMoney}<br><br>Detaljer:<br>` + results.join("<br>");


  });
  