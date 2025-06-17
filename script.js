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
  
    const matchCount = (fullText.match(/\bAI\b/gi) || []).length;
    feedback.textContent = `"AI" appears ${matchCount} times in this PDF.`;
  });
  