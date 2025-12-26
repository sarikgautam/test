import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface DismissalInfo {
  type: 'not_out' | 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'mankad' | 'retired_hurt' | 'other';
  bowler?: string;
  fielder?: string;
}

export interface BattingStats {
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal: DismissalInfo;
  innings: number;
}

export interface BowlingStats {
  bowlerName: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  innings: number;
}

export interface MatchInfo {
  team1?: string;
  team2?: string;
  team1Score?: number;
  team1Wickets?: number;
  team1Overs?: number;
  winningTeam?: string;
  resultMargin?: number;
  resultType?: string;
  tournament?: string;
  dateTime?: string;
  venue?: string;
  tossWinner?: string;
  tossChoice?: string;
}

export interface ParsedScorecard {
  matchInfo: MatchInfo;
  innings1Batting: BattingStats[];
  innings1Bowling: BowlingStats[];
  innings2Batting: BattingStats[];
  innings2Bowling: BowlingStats[];
}

/**
 * Parse dismissal notation to extract type and related players
 */
function parseDismissal(dismissalText: string): DismissalInfo {
  const text = dismissalText.trim().toLowerCase();

  // not out
  if (text.includes('notout') || text.includes('not out')) {
    return { type: 'not_out' };
  }

  // caught and bowled: c&b BowlerName
  const candbMatch = dismissalText.match(/c&b\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
  if (candbMatch) {
    const bowler = candbMatch[1].trim();
    return { type: 'caught', bowler, fielder: bowler };
  }

  // caught: c FielderName b BowlerName (with spaces)
  const caughtMatchSpaced = dismissalText.match(/c\s+([A-Za-z]+(?:\s+[A-Za-z]+)*?)\s+b\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
  if (caughtMatchSpaced) {
    const fielder = caughtMatchSpaced[1].trim();
    const bowler = caughtMatchSpaced[2].trim();
    return { type: 'caught', bowler, fielder };
  }

  // caught: cFielderNamebBowlerName (without spaces - from PDF extraction)
  const caughtMatchNoSpace = dismissalText.match(/^c([A-Za-z]+)b([A-Za-z]+)$/i);
  if (caughtMatchNoSpace) {
    const fielder = caughtMatchNoSpace[1];
    const bowler = caughtMatchNoSpace[2];
    return { type: 'caught', bowler, fielder };
  }

  // lbw: lbw b BowlerName or just lbw BowlerName or lbwBowlerName
  const lbwMatch = dismissalText.match(/lbw\s*(?:b\s*)?([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
  if (lbwMatch) {
    const bowler = lbwMatch[1].trim();
    return { type: 'lbw', bowler };
  }

  // bowled: b BowlerName (with space or without)
  const bowledMatch = dismissalText.match(/\bb\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
  if (bowledMatch) {
    const bowler = bowledMatch[1].trim();
    return { type: 'bowled', bowler };
  }

  // run out: run out (FielderName) or runout(FielderName)
  const runoutMatch = text.match(/run\s*out(?:\s*\(([^)]+)\))?/i);
  if (runoutMatch) {
    const fielder = runoutMatch[1]?.trim();
    return { type: 'runout', fielder };
  }

  // stumped: st FielderName b BowlerName (with spaces)
  const stumpedMatchSpaced = dismissalText.match(/st\s+([A-Za-z]+(?:\s+[A-Za-z]+)*?)\s+b\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
  if (stumpedMatchSpaced) {
    const fielder = stumpedMatchSpaced[1].trim();
    const bowler = stumpedMatchSpaced[2].trim();
    return { type: 'stumped', bowler, fielder };
  }

  // stumped: stFielderNamebBowlerName (without spaces)
  const stumpedMatchNoSpace = dismissalText.match(/^st([A-Za-z]+)b([A-Za-z]+)$/i);
  if (stumpedMatchNoSpace) {
    const fielder = stumpedMatchNoSpace[1];
    const bowler = stumpedMatchNoSpace[2];
    return { type: 'stumped', bowler, fielder };
  }

  // mankad: mankad by BowlerName or just "mankad"
  const mankadMatch = dismissalText.match(/mankad(?:\s+by\s+([A-Za-z]+(?:\s+[A-Za-z]+)*))?/i);
  if (mankadMatch) {
    const bowler = mankadMatch[1]?.trim();
    return { type: 'mankad', bowler };
  }

  // retired hurt
  if (text.includes('retired') && text.includes('hurt')) {
    return { type: 'retired_hurt' };
  }

  // Default: other
  console.log(`Could not parse dismissal: "${dismissalText}"`);
  return { type: 'other' };
}

/**
 * Extract match information from page 1
 */
function parseMatchInfo(text: string): MatchInfo {
  const info: MatchInfo = {};

  // Match result
  const resultMatch = text.match(/(\w+.*?)\s+(\d+)-(\d+)in([\d.]+)overs\s+(\w+.*?)\s+won\s+by\s+(\d+)\s+(wickets|runs)/i);
  if (resultMatch) {
    info.team1 = resultMatch[1].trim();
    info.team1Score = parseInt(resultMatch[2]);
    info.team1Wickets = parseInt(resultMatch[3]);
    info.team1Overs = parseFloat(resultMatch[4]);
    info.team2 = resultMatch[5].trim();
    info.winningTeam = resultMatch[5].trim();
    info.resultMargin = parseInt(resultMatch[6]);
    info.resultType = resultMatch[7].trim();
  }

  // Tournament
  const tournamentMatch = text.match(/Tournament\s+([^\n]+)/i);
  if (tournamentMatch) {
    info.tournament = tournamentMatch[1].trim();
  }

  // Date and time
  const dateMatch = text.match(/Date&Time\s+([^\n]+)/i);
  if (dateMatch) {
    info.dateTime = dateMatch[1].trim();
  }

  // Venue
  const venueMatch = text.match(/Venue\s+([^\n]+)/i);
  if (venueMatch) {
    info.venue = venueMatch[1].trim();
  }

  // Toss
  const tossMatch = text.match(/Toss\s+(\w+.*?)\s+Opted\s+To\s+(Bat|Bowl)/i);
  if (tossMatch) {
    info.tossWinner = tossMatch[1].trim();
    info.tossChoice = tossMatch[2].trim();
  }

  return info;
}

/**
 * Parse batting scorecard for a specific innings
 */
function parseBattingScorecard(text: string, innings: number): BattingStats[] {
  const stats: BattingStats[] = [];

  // The PDF might not preserve exact section headers, so let's search more flexibly
  // Look for the team name patterns and batting stats that follow
  
  // First, try to find sections by looking for the exact headers
  let pattern = innings === 1
    ? /1st\s*Innings\s*Scorecard([\s\S]*?)(?=2nd\s*Innings\s*Scorecard|Over\s*Comparison|$)/i
    : /2nd\s*Innings\s*Scorecard([\s\S]*?)(?=Over\s*Comparison|$)/i;

  let inningsMatch = text.match(pattern);
  
  if (!inningsMatch) {
    console.log(`Trying alternative pattern for innings ${innings}`);
    // Alternative: look for team name followed by R B 4s 6s SR pattern
    // Split by "---PAGE_BREAK---" and look at individual pages
    const pages = text.split('---PAGE_BREAK---');
    console.log(`Found ${pages.length} pages`);
    
    // Page 2 should have 1st innings (index 1), Page 3 should have 2nd innings (index 2)
    const pageIndex = innings === 1 ? 1 : 2;
    
    if (pages.length > pageIndex) {
      console.log(`Using page ${pageIndex + 1} for innings ${innings}`);
      console.log(`Page ${pageIndex + 1} preview:`, pages[pageIndex].substring(0, 500));
      
      // Look for the R B 4s 6s SR pattern on this page
      const rbPattern = /R\s+B\s+4s\s+6s\s+SR/i;
      if (rbPattern.test(pages[pageIndex])) {
        // Parse this page as the innings section
        return parseBattingFromText(pages[pageIndex], innings);
      }
    }
    
    console.log(`No innings ${innings} section found in text`);
    return stats;
  }

  return parseBattingFromText(inningsMatch[1], innings);
}

function parseBattingFromText(inningsSection: string, innings: number): BattingStats[] {
  const stats: BattingStats[] = [];
  
  console.log(`Innings ${innings} section length:`, inningsSection.length);
  console.log(`Innings ${innings} preview:`, inningsSection.substring(0, 300));
  
  // Split text into words/tokens to parse more flexibly
  const tokens = inningsSection.split(/\s+/).filter(t => t.length > 0);
  
  // Find where batting stats start (after R B 4s 6s SR header)
  let startIndex = -1;
  for (let i = 0; i < tokens.length - 4; i++) {
    if (tokens[i] === 'R' && tokens[i+1] === 'B' && tokens[i+2] === '4s' && tokens[i+3] === '6s' && tokens[i+4] === 'SR') {
      startIndex = i + 5;
      break;
    }
  }
  
  if (startIndex === -1) {
    console.log('Could not find batting stats header (R B 4s 6s SR)');
    return stats;
  }
  
  console.log('Found batting header at token index:', startIndex);
  
  // Parse batting rows - each row has: PlayerName dismissal runs balls 4s 6s SR
  // Look for pattern: Name (capitalized) followed by dismissal text, then 5 numbers
  for (let i = startIndex; i < tokens.length - 6; i++) {
    const token = tokens[i];
    
    // Stop at section markers
    if (/^(Extras|Bowler|Total|FallOf)/i.test(token)) {
      break;
    }
    
    // Check if this looks like a player name (starts with capital letter)
    if (/^[A-Z][a-z]+/.test(token)) {
      // Collect potential player name (could be multi-word like "Ramesh Subedi")
      let playerName = token;
      let nextIdx = i + 1;
      
      // Check if next token is also part of name (capitalized)
      while (nextIdx < tokens.length && /^[A-Z][a-z]+/.test(tokens[nextIdx])) {
        playerName += ' ' + tokens[nextIdx];
        nextIdx++;
      }
      
      // Next should be dismissal info (starts with lowercase)
      if (nextIdx >= tokens.length || !/^[a-z&]/.test(tokens[nextIdx])) {
        continue;
      }
      
      let dismissalText = tokens[nextIdx];
      nextIdx++;
      
      // Dismissal might be multi-token (e.g., "c", "Fielder", "b", "Bowler")
      // or single token (e.g., "bRodin", "notout")
      // Collect until we hit a number
      while (nextIdx < tokens.length && !/^\d+$/.test(tokens[nextIdx])) {
        dismissalText += tokens[nextIdx];
        nextIdx++;
      }
      
      // Now we should have 5 numbers: runs, balls, 4s, 6s, SR
      if (nextIdx + 4 >= tokens.length) {
        continue;
      }
      
      const runsStr = tokens[nextIdx];
      const ballsStr = tokens[nextIdx + 1];
      const foursStr = tokens[nextIdx + 2];
      const sixesStr = tokens[nextIdx + 3];
      const srStr = tokens[nextIdx + 4];
      
      // Validate they're all numbers
      if (!/^\d+$/.test(runsStr) || !/^\d+$/.test(ballsStr) || 
          !/^\d+$/.test(foursStr) || !/^\d+$/.test(sixesStr) || 
          !/^[\d.]+$/.test(srStr)) {
        continue;
      }
      
      const runs = parseInt(runsStr);
      const balls = parseInt(ballsStr);
      const fours = parseInt(foursStr);
      const sixes = parseInt(sixesStr);
      const strikeRate = parseFloat(srStr);
      
      const dismissal = parseDismissal(dismissalText);
      
      stats.push({
        playerName,
        runs,
        balls,
        fours,
        sixes,
        strikeRate,
        dismissal,
        innings,
      });
      
      console.log(`Parsed batting stat for ${playerName}: ${runs}(${balls}) - ${dismissalText}`);
      
      // Move index forward past this entry
      i = nextIdx + 4;
    }
  }

  console.log(`Found ${stats.length} batting stats for innings ${innings}`);
  return stats;
}

/**
 * Parse bowling scorecard for a specific innings
 */
function parseBowlingScorecard(text: string, innings: number): BowlingStats[] {
  const stats: BowlingStats[] = [];

  // Try exact pattern first
  let pattern = innings === 1
    ? /1st\s*Innings\s*Scorecard([\s\S]*?)(?=2nd\s*Innings\s*Scorecard|Over\s*Comparison|$)/i
    : /2nd\s*Innings\s*Scorecard([\s\S]*?)(?=Over\s*Comparison|$)/i;

  let inningsMatch = text.match(pattern);
  
  if (!inningsMatch) {
    // Alternative: use page-based extraction
    const pages = text.split('---PAGE_BREAK---');
    const pageIndex = innings === 1 ? 1 : 2;
    
    if (pages.length > pageIndex) {
      return parseBowlingFromText(pages[pageIndex], innings);
    }
    
    console.log(`No innings ${innings} section found for bowling`);
    return stats;
  }

  return parseBowlingFromText(inningsMatch[1], innings);
}

function parseBowlingFromText(inningsSection: string, innings: number): BowlingStats[] {
  const stats: BowlingStats[] = [];
  const tokens = inningsSection.split(/\s+/).filter(t => t.length > 0);

  // Find bowling header: Bowler O M R W Eco
  let startIndex = -1;
  for (let i = 0; i < tokens.length - 5; i++) {
    if (tokens[i] === 'Bowler' && tokens[i+1] === 'O' && tokens[i+2] === 'M' && 
        tokens[i+3] === 'R' && tokens[i+4] === 'W' && tokens[i+5] === 'Eco') {
      startIndex = i + 6;
      break;
    }
  }

  if (startIndex === -1) {
    console.log('Could not find bowling header');
    return stats;
  }

  console.log('Found bowling header at token index:', startIndex);

  // Parse bowling rows: BowlerName overs maidens runs wickets economy (plus extra columns)
  for (let i = startIndex; i < tokens.length - 5; i++) {
    const token = tokens[i];
    
    // Stop at section markers
    if (/^(Total|Match|Download|FallOf|Over)/i.test(token)) {
      break;
    }
    
    // Check for bowler name (capitalized)
    if (/^[A-Z][a-z]+/.test(token)) {
      let bowlerName = token;
      let nextIdx = i + 1;
      
      // Multi-word name
      while (nextIdx < tokens.length && /^[A-Z][a-z]+/.test(tokens[nextIdx])) {
        bowlerName += ' ' + tokens[nextIdx];
        nextIdx++;
      }
      
      // Next should be numbers: overs maidens runs wickets economy
      if (nextIdx + 4 >= tokens.length) {
        continue;
      }
      
      const oversStr = tokens[nextIdx];
      const maidensStr = tokens[nextIdx + 1];
      const runsStr = tokens[nextIdx + 2];
      const wicketsStr = tokens[nextIdx + 3];
      const economyStr = tokens[nextIdx + 4];
      
      // Validate
      if (!/^[\d.]+$/.test(oversStr) || !/^\d+$/.test(maidensStr) || 
          !/^\d+$/.test(runsStr) || !/^\d+$/.test(wicketsStr) || 
          !/^[\d.]+$/.test(economyStr)) {
        continue;
      }
      
      const overs = parseFloat(oversStr);
      const maidens = parseInt(maidensStr);
      const runs = parseInt(runsStr);
      const wickets = parseInt(wicketsStr);
      const economy = parseFloat(economyStr);

      stats.push({
        bowlerName,
        overs,
        maidens,
        runs,
        wickets,
        economy,
        innings,
      });
      
      console.log(`Parsed bowling stat for ${bowlerName}: ${overs} overs, ${runs}R, ${wickets}W`);
      
      i = nextIdx + 4;
    }
  }

  console.log(`Found ${stats.length} bowling stats for innings ${innings}`);
  return stats;
}

/**
 * Extract text from PDF file
 */
async function extractPDFText(file: File): Promise<string> {
  try {
    console.log('Starting PDF extraction for file:', file.name, 'size:', file.size);
    
    if (!file.size) {
      throw new Error('PDF file is empty');
    }

    const arrayBuffer = await file.arrayBuffer();
    console.log('Converted file to ArrayBuffer, size:', arrayBuffer.byteLength);

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF loaded successfully, pages:', pdf.numPages);

    if (pdf.numPages === 0) {
      throw new Error('PDF has no pages');
    }

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n---PAGE_BREAK---\n';
      console.log(`Extracted page ${i}, text length: ${pageText.length}`);
    }

    console.log('PDF text extraction complete, total length:', fullText.length);
    
    if (!fullText.trim()) {
      throw new Error('No text could be extracted from PDF - file might be scanned image');
    }

    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse STUMPS cricket scorecard PDF
 */
export async function parsePDFScorecard(file: File): Promise<ParsedScorecard> {
  console.log('Starting PDF parse for:', file.name);
  const text = await extractPDFText(file);
  
  console.log('Extracted text length:', text.length);
  console.log('Text preview:', text.substring(0, 500));

  const matchInfo = parseMatchInfo(text);
  console.log('Match info:', matchInfo);

  const innings1Batting = parseBattingScorecard(text, 1);
  const innings1Bowling = parseBowlingScorecard(text, 1);
  const innings2Batting = parseBattingScorecard(text, 2);
  const innings2Bowling = parseBowlingScorecard(text, 2);

  console.log('Parse complete - Batting stats:', {
    innings1: innings1Batting.length,
    innings2: innings2Batting.length,
  });

  return {
    matchInfo,
    innings1Batting,
    innings1Bowling,
    innings2Batting,
    innings2Bowling,
  };
}
