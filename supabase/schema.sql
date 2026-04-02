-- Years table
CREATE TABLE years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT UNIQUE NOT NULL,
  access_code TEXT NOT NULL,
  entry_fee INT NOT NULL DEFAULT 25,
  picks_open BOOLEAN NOT NULL DEFAULT true,
  winning_score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE golfer_status AS ENUM ('active', 'cut', 'wd');

CREATE TABLE golfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier INT NOT NULL CHECK (tier BETWEEN 1 AND 4),
  day1_score INT,
  day2_score INT,
  day3_score INT,
  day4_score INT,
  status golfer_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_golfers_year ON golfers(year_id);

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  tiebreaker_guess INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(year_id, name)
);

CREATE INDEX idx_participants_year ON participants(year_id);

CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  golfer_id UUID NOT NULL REFERENCES golfers(id) ON DELETE CASCADE,
  UNIQUE(participant_id, golfer_id)
);

CREATE INDEX idx_picks_participant ON picks(participant_id);
CREATE INDEX idx_picks_golfer ON picks(golfer_id);

ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read years" ON years FOR SELECT USING (true);
CREATE POLICY "Public read golfers" ON golfers FOR SELECT USING (true);
CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Public read picks" ON picks FOR SELECT USING (true);

CREATE POLICY "Service insert years" ON years FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update years" ON years FOR UPDATE USING (true);
CREATE POLICY "Service insert golfers" ON golfers FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update golfers" ON golfers FOR UPDATE USING (true);
CREATE POLICY "Service insert participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update participants" ON participants FOR UPDATE USING (true);
CREATE POLICY "Service insert picks" ON picks FOR INSERT WITH CHECK (true);
