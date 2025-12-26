import pdfplumber
import re
from typing import Dict, List, Any, Optional, Tuple

class STUMPSPDFParser:
    """Parse STUMPS cricket scorecard PDFs using regex patterns"""
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.pages = []
        self.match_info = {}
        self.batting_stats = []
        self.bowling_stats = []
        
    def extract_text(self) -> str:
        """Extract all text from PDF"""
        text = ""
        with pdfplumber.open(self.pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
                text += "\n---PAGE_BREAK---\n"
        return text
    
    def parse_match_info(self, text: str) -> Dict[str, Any]:
        """Extract match information from page 1"""
        info = {}
        
        # Match title and result
        result_match = re.search(r'(\w+.*?)\s+(\d+)-(\d+)in([\d.]+)overs\s+(\w+.*?)\s+won\s+by\s+(\d+)\s+(wickets|runs)', text, re.IGNORECASE)
        if result_match:
            info['team1'] = result_match.group(1).strip()
            info['team1_score'] = int(result_match.group(2))
            info['team1_wickets'] = int(result_match.group(3))
            info['team1_overs'] = float(result_match.group(4))
            info['team2'] = result_match.group(5).strip()
            info['winning_team'] = result_match.group(5).strip()
            info['result_margin'] = int(result_match.group(6))
            info['result_type'] = result_match.group(7).strip()
        
        # Tournament
        tournament_match = re.search(r'Tournament\s+([^\n]+)', text)
        if tournament_match:
            info['tournament'] = tournament_match.group(1).strip()
        
        # Date and time
        date_match = re.search(r'Date&Time\s+([^\n]+)', text)
        if date_match:
            info['date_time'] = date_match.group(1).strip()
        
        # Venue
        venue_match = re.search(r'Venue\s+([^\n]+)', text)
        if venue_match:
            info['venue'] = venue_match.group(1).strip()
        
        # Toss
        toss_match = re.search(r'Toss\s+(\w+.*?)\s+Opted\s+To\s+(Bat|Bowl)', text, re.IGNORECASE)
        if toss_match:
            info['toss_winner'] = toss_match.group(1).strip()
            info['toss_choice'] = toss_match.group(2).strip()
        
        return info
    
    def parse_dismissal(self, dismissal_text: str) -> Tuple[str, Optional[str], Optional[str]]:
        """
        Parse dismissal notation to extract type and related players
        Returns: (dismissal_type, bowler_name, fielder_name)
        """
        dismissal_text = dismissal_text.strip()
        
        # not out
        if 'notout' in dismissal_text.lower() or 'not out' in dismissal_text.lower():
            return ('not_out', None, None)
        
        # bowled: b BowlerName
        bowled_match = re.search(r'\bb\s+(\w+(?:\s+\w+)*?)(?:\s|$)', dismissal_text, re.IGNORECASE)
        if bowled_match:
            bowler = bowled_match.group(1).strip()
            return ('bowled', bowler, None)
        
        # caught and bowled: c&b BowlerName
        candb_match = re.search(r'c&b\s+(\w+(?:\s+\w+)*?)(?:\s|$)', dismissal_text, re.IGNORECASE)
        if candb_match:
            bowler = candb_match.group(1).strip()
            return ('caught', bowler, bowler)  # fielder is also the bowler
        
        # caught: c FielderName b BowlerName
        caught_match = re.search(r'c\s+(\w+(?:\s+\w+)*?)\s+b\s+(\w+(?:\s+\w+)*?)(?:\s|$)', dismissal_text, re.IGNORECASE)
        if caught_match:
            fielder = caught_match.group(1).strip()
            bowler = caught_match.group(2).strip()
            return ('caught', bowler, fielder)
        
        # lbw: lbw b BowlerName
        lbw_match = re.search(r'lbw\s+b\s+(\w+(?:\s+\w+)*?)(?:\s|$)', dismissal_text, re.IGNORECASE)
        if lbw_match:
            bowler = lbw_match.group(1).strip()
            return ('lbw', bowler, None)
        
        # run out: run out (FielderName) or just "run out"
        runout_match = re.search(r'run\s+out(?:\s*\(([^)]+)\))?', dismissal_text, re.IGNORECASE)
        if runout_match:
            fielder = runout_match.group(1).strip() if runout_match.group(1) else None
            return ('runout', None, fielder)
        
        # stumped: st FielderName b BowlerName
        stumped_match = re.search(r'st\s+(\w+(?:\s+\w+)*?)\s+b\s+(\w+(?:\s+\w+)*?)(?:\s|$)', dismissal_text, re.IGNORECASE)
        if stumped_match:
            fielder = stumped_match.group(1).strip()
            bowler = stumped_match.group(2).strip()
            return ('stumped', bowler, fielder)
        
        # mankad: mankad by BowlerName or just "mankad"
        mankad_match = re.search(r'mankad(?:\s+by\s+(\w+(?:\s+\w+)*?))?(?:\s|$)', dismissal_text, re.IGNORECASE)
        if mankad_match:
            bowler = mankad_match.group(1).strip() if mankad_match.group(1) else None
            return ('mankad', bowler, None)
        
        # Default: other
        return ('other', None, None)
    
    def parse_batting_scorecard(self, text: str, innings: int = 1) -> List[Dict[str, Any]]:
        """
        Extract batting statistics from scorecard
        innings: 1 for 1st innings, 2 for 2nd innings
        """
        stats = []
        
        # Find the innings section
        if innings == 1:
            pattern = r'1stInningsScorecard.*?(?=2ndInningsScorecard|OverComparison|---PAGE_BREAK---|$)'
        else:
            pattern = r'2ndInningsScorecard.*?(?=OverComparison|---PAGE_BREAK---|$)'
        
        innings_text = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if not innings_text:
            return stats
        
        innings_section = innings_text.group(0)
        
        # Split into batting and bowling sections
        # Batting table comes first, bowling after "Bowler"
        lines = innings_section.split('\n')
        
        in_batting_table = False
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Start of batting table
            if re.match(r'^\w+.*?\s+R\s+B\s+4s\s+6s\s+SR', line, re.IGNORECASE):
                in_batting_table = True
                continue
            
            # End of batting table (when we see "Extras" or "Bowler")
            if re.match(r'(Extras|Bowler|Total|FallOf)', line, re.IGNORECASE):
                in_batting_table = False
                continue
            
            # Parse batting row
            if in_batting_table and line:
                # Pattern: PlayerName dismissal_info runs balls 4s 6s sr
                # e.g., "BinayaKhadka bRodin 9 8 1 0 112.5"
                match = re.match(r'^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*?)\s+([a-z].*?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+\.?\d*)', line)
                if match:
                    player_name = match.group(1).strip()
                    dismissal_text = match.group(2).strip()
                    runs = int(match.group(3))
                    balls = int(match.group(4))
                    fours = int(match.group(5))
                    sixes = int(match.group(6))
                    sr = float(match.group(7))
                    
                    dismissal_type, bowler, fielder = self.parse_dismissal(dismissal_text)
                    
                    stat = {
                        'player_name': player_name,
                        'runs': runs,
                        'balls': balls,
                        'fours': fours,
                        'sixes': sixes,
                        'strike_rate': sr,
                        'dismissal_type': dismissal_type,
                        'bowler_name': bowler,
                        'fielder_name': fielder,
                        'innings': innings
                    }
                    stats.append(stat)
        
        return stats
    
    def parse_bowling_scorecard(self, text: str, innings: int = 1) -> List[Dict[str, Any]]:
        """Extract bowling statistics from scorecard"""
        stats = []
        
        # Find the innings section
        if innings == 1:
            pattern = r'1stInningsScorecard.*?(?=2ndInningsScorecard|OverComparison|---PAGE_BREAK---|$)'
        else:
            pattern = r'2ndInningsScorecard.*?(?=OverComparison|---PAGE_BREAK---|$)'
        
        innings_text = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if not innings_text:
            return stats
        
        innings_section = innings_text.group(0)
        lines = innings_section.split('\n')
        
        in_bowling_table = False
        for line in lines:
            line = line.strip()
            
            # Start of bowling table
            if re.match(r'Bowler\s+O\s+M\s+R\s+W\s+Eco', line, re.IGNORECASE):
                in_bowling_table = True
                continue
            
            # End of bowling table
            if re.match(r'(Total|Match|Download)', line, re.IGNORECASE):
                in_bowling_table = False
                continue
            
            # Parse bowling row
            if in_bowling_table and line:
                # Pattern: BowlerName overs maidens runs wickets economy ...
                # e.g., "AmitChaulagain 2.0 0 18 0 9.0 4 1 1 1 1"
                match = re.match(r'^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*?)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)', line)
                if match:
                    bowler_name = match.group(1).strip()
                    overs = float(match.group(2))
                    maidens = int(match.group(3))
                    runs = int(match.group(4))
                    wickets = int(match.group(5))
                    economy = float(match.group(6))
                    
                    stat = {
                        'bowler_name': bowler_name,
                        'overs': overs,
                        'maidens': maidens,
                        'runs': runs,
                        'wickets': wickets,
                        'economy': economy,
                        'innings': innings
                    }
                    stats.append(stat)
        
        return stats
    
    def parse(self) -> Dict[str, Any]:
        """Parse entire PDF and return structured data"""
        text = self.extract_text()
        
        result = {
            'match_info': self.parse_match_info(text),
            'innings_1_batting': self.parse_batting_scorecard(text, 1),
            'innings_1_bowling': self.parse_bowling_scorecard(text, 1),
            'innings_2_batting': self.parse_batting_scorecard(text, 2),
            'innings_2_bowling': self.parse_bowling_scorecard(text, 2),
        }
        
        return result


# Test the parser
if __name__ == '__main__':
    parser = STUMPSPDFParser('/Users/sarikgautam/Documents/GNCPL/LovDev/goldcoast-cricket-feud/hhvsys.pdf')
    result = parser.parse()
    
    import json
    print(json.dumps(result, indent=2))
