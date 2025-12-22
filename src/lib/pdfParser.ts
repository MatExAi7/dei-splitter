import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

/**
 * Normalize Greek text - remove accents and convert to lowercase
 */
export function normalizeGreek(text: string): string {
  const accentMap: Record<string, string> = {
    'ά': 'α', 'έ': 'ε', 'ή': 'η', 'ί': 'ι', 'ό': 'ο', 'ύ': 'υ', 'ώ': 'ω',
    'Ά': 'Α', 'Έ': 'Ε', 'Ή': 'Η', 'Ί': 'Ι', 'Ό': 'Ο', 'Ύ': 'Υ', 'Ώ': 'Ω',
    'ϊ': 'ι', 'ϋ': 'υ', 'ΐ': 'ι', 'ΰ': 'υ'
  };
  
  return text
    .split('')
    .map(char => accentMap[char] || char)
    .join('')
    .toLowerCase();
}

/**
 * Parse European number format (1.234,56) to standard number
 */
export function parseEuropeanNumber(text: string): number | null {
  // Remove spaces and normalize
  let cleaned = text.trim().replace(/\s/g, '');
  
  // Handle European format: 1.234,56 → 1234.56
  // First check if it's European format (has comma as decimal separator)
  if (cleaned.includes(',')) {
    // Remove thousand separators (dots) and replace decimal comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPdf(file: File): Promise<{ success: boolean; text: string; error?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    // Check if we got meaningful text
    if (fullText.trim().length < 50) {
      return {
        success: false,
        text: '',
        error: 'Δεν διαβάζεται ως κείμενο. Χρειάζεται PDF με επιλέξιμο κείμενο (όχι σαρωμένη εικόνα).'
      };
    }
    
    return { success: true, text: fullText };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: 'Σφάλμα ανάγνωσης PDF. Δοκιμάστε διαφορετικό αρχείο.'
    };
  }
}

export interface ParsedField {
  key: string;
  label: string;
  value: number | null;
  rawMatch: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface UnmappedLine {
  text: string;
  potentialAmount: number | null;
}

export interface ParsedBillData {
  periodFrom: string | null;
  periodTo: string | null;
  totalKwh: number | null;
  fields: ParsedField[];
  unmappedLines: UnmappedLine[];
  rawText: string;
}

// Keywords for each category (normalized)
const CATEGORY_PATTERNS: { key: string; label: string; patterns: string[] }[] = [
  { 
    key: 'energy_supply', 
    label: 'Προμήθεια/Χρέωση ενέργειας',
    patterns: ['χρεωση ενεργειας', 'προμηθεια ενεργειας', 'ενεργειακη χρεωση', 'χρεωση προμηθειας', 'προμηθεια']
  },
  { 
    key: 'fixed_fee', 
    label: 'Πάγιο',
    patterns: ['παγιο', 'παγια χρεωση', 'σταθερη χρεωση']
  },
  { 
    key: 'regulated', 
    label: 'Ρυθμιζόμενες χρεώσεις',
    patterns: ['ρυθμιζομενες', 'ρυθμιζομενη χρεωση', 'χρεωσεις χρησης δικτυου', 'υπηρεσιες κοινης ωφελειας', 'χρησης συστηματος']
  },
  { 
    key: 'misc', 
    label: 'Διάφορα/Λοιπές',
    patterns: ['διαφορα', 'λοιπες χρεωσεις', 'λοιπα', 'αλλες χρεωσεις']
  },
  { 
    key: 'municipal_fees_dt', 
    label: 'Δημοτικά Τέλη (ΔΤ)',
    patterns: ['δημοτικα τελη', 'δ.τ.', 'δτ']
  },
  { 
    key: 'municipal_tax_df', 
    label: 'Δημοτικός Φόρος (ΔΦ)',
    patterns: ['δημοτικος φορος', 'δ.φ.', 'δφ']
  },
  { 
    key: 'tap', 
    label: 'ΤΑΠ',
    patterns: ['τ.α.π.', 'ταπ', 'τελος ακινητης περιουσιας']
  },
  { 
    key: 'ert', 
    label: 'ΕΡΤ',
    patterns: ['ε.ρ.τ.', 'ερτ', 'ανταποδοτικο τελος ερτ', 'ραδιοτηλεοραση']
  },
  { 
    key: 'vat', 
    label: 'ΦΠΑ',
    patterns: ['φ.π.α.', 'φπα', 'φορος προστιθεμενης αξιας']
  }
];

/**
 * Parse bill text and extract fields using rule-based matching
 */
export function parseBillText(text: string): ParsedBillData {
  const normalizedText = normalizeGreek(text);
  const lines = text.split('\n').filter(l => l.trim());
  
  const result: ParsedBillData = {
    periodFrom: null,
    periodTo: null,
    totalKwh: null,
    fields: [],
    unmappedLines: [],
    rawText: text
  };
  
  // Try to extract period dates
  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g,
    /(\d{1,2})\s+(ιαν|φεβ|μαρ|απρ|μαι|ιουν|ιουλ|αυγ|σεπ|οκτ|νοε|δεκ)[α-ω]*\s+(\d{4})/gi
  ];
  
  const dates: string[] = [];
  for (const pattern of datePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      dates.push(match[0]);
    }
  }
  
  if (dates.length >= 2) {
    result.periodFrom = dates[0];
    result.periodTo = dates[1];
  }
  
  // Try to extract kWh
  const kwhPatterns = [
    /(\d+[\.,]?\d*)\s*kwh/gi,
    /κατανάλωση[:\s]*(\d+[\.,]?\d*)/gi,
    /συνολική κατανάλωση[:\s]*(\d+[\.,]?\d*)/gi
  ];
  
  for (const pattern of kwhPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numMatch = match[0].match(/(\d+[\.,]?\d*)/);
      if (numMatch) {
        result.totalKwh = parseEuropeanNumber(numMatch[1]);
        if (result.totalKwh !== null) break;
      }
    }
  }
  
  // Track which lines have been matched
  const matchedLineIndices = new Set<number>();
  
  // Extract amounts for each category
  for (const category of CATEGORY_PATTERNS) {
    let bestMatch: { value: number; rawMatch: string; confidence: 'high' | 'medium' | 'low'; lineIndex: number } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const normalizedLine = normalizeGreek(line);
      
      for (const pattern of category.patterns) {
        if (normalizedLine.includes(pattern)) {
          // Look for amount in the same line or next line
          const amountPattern = /(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2}))\s*€?/g;
          const amounts = line.match(amountPattern);
          
          if (amounts && amounts.length > 0) {
            // Take the last amount (usually the total)
            const rawAmount = amounts[amounts.length - 1];
            const value = parseEuropeanNumber(rawAmount);
            
            if (value !== null && (!bestMatch || value > (bestMatch.value || 0))) {
              bestMatch = {
                value,
                rawMatch: line.trim(),
                confidence: pattern.length > 5 ? 'high' : 'medium',
                lineIndex: i
              };
            }
          }
          break;
        }
      }
    }
    
    if (bestMatch) {
      result.fields.push({
        key: category.key,
        label: category.label,
        value: bestMatch.value,
        rawMatch: bestMatch.rawMatch,
        confidence: bestMatch.confidence
      });
      matchedLineIndices.add(bestMatch.lineIndex);
    }
  }
  
  // Collect unmapped lines that contain amounts
  const amountPattern = /(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2}))\s*€?/;
  
  for (let i = 0; i < lines.length; i++) {
    if (matchedLineIndices.has(i)) continue;
    
    const line = lines[i].trim();
    if (line.length < 5) continue;
    
    const match = line.match(amountPattern);
    if (match) {
      const amount = parseEuropeanNumber(match[1]);
      if (amount !== null && amount > 0.5 && amount < 10000) {
        result.unmappedLines.push({
          text: line,
          potentialAmount: amount
        });
      }
    }
  }
  
  // Limit unmapped lines to most relevant ones
  result.unmappedLines = result.unmappedLines.slice(0, 10);
  
  return result;
}

// Mock data for testing the flow
export const MOCK_PDF_TEXT = `
ΛΟΓΑΡΙΑΣΜΟΣ ΗΛΕΚΤΡΙΚΟΥ ΡΕΥΜΑΤΟΣ
Περίοδος κατανάλωσης: 01/06/2025 - 30/06/2025
Αριθμός Λογαριασμού: DEI-2025-06-001

ΣΤΟΙΧΕΙΑ ΚΑΤΑΝΑΛΩΣΗΣ
Κατανάλωση περιόδου: 250 kWh

ΑΝΑΛΥΣΗ ΧΡΕΩΣΕΩΝ

Χρέωση Ενέργειας                    45,20 €
Πάγιο                                8,50 €
Ρυθμιζόμενες Χρεώσεις              12,30 €
Διάφορα/Λοιπές                       3,80 €

ΦΟΡΟΙ & ΤΕΛΗ
Δημοτικά Τέλη (Δ.Τ.)               15,60 €
Δημοτικός Φόρος (Δ.Φ.)              8,40 €
Τ.Α.Π.                             12,50 €
Ε.Ρ.Τ.                              3,00 €

Φ.Π.Α. 6%                          15,82 €

Έκπτωση συνεπούς πελάτη            -7,88 €

ΣΥΝΟΛΟ ΠΛΗΡΩΜΗΣ                   117,24 €
`;
