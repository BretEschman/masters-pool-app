"use client";

import { useState, useEffect, useCallback } from "react";
import { Year, Golfer, Participant } from "@/lib/types";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tab, setTab] = useState<"setup" | "scores" | "payments">("scores");
  const [yearData, setYearData] = useState<Year | null>(null);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [accessCode, setAccessCode] = useState("");
  const [golferText, setGolferText] = useState("");
  const [message, setMessage] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${password}` };

  const loadData = useCallback(async () => {
    const yRes = await fetch("/api/years");
    const yData = await yRes.json();
    setYears(yData);
  }, []);

  function login() { setAuthed(true); loadData(); }

  useEffect(() => {
    if (!authed || years.length === 0) return;
    const yd = years.find((y) => y.year === selectedYear) || null;
    setYearData(yd);
    fetch(`/api/golfers?year=${selectedYear}`).then((r) => r.json()).then((data) => setGolfers(data.golfers || []));
    fetch(`/api/standings?year=${selectedYear}`).then((r) => r.json()).then((data) => {
      setParticipants((data.standings || []).map((s: { participant: Participant }) => s.participant));
    });
  }, [authed, selectedYear, years]);

  async function createYear() {
    setMessage("");
    const res = await fetch("/api/admin/year", { method: "POST", headers, body: JSON.stringify({ year: newYear, access_code: accessCode, picks_open: true }) });
    if (res.ok) { setMessage(`Year ${newYear} created!`); loadData(); }
    else { const d = await res.json(); setMessage(`Error: ${d.error}`); }
  }

  async function uploadGolfers() {
    setMessage("");
    const yearRecord = years.find((y) => y.year === selectedYear);
    if (!yearRecord) { setMessage("Select a year first"); return; }
    const lines = golferText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: { name: string; tier: number }[] = [];
    let currentTier = 0;
    for (const line of lines) {
      const tierMatch = line.match(/^tier\s*(\d)/i);
      if (tierMatch) { currentTier = Number(tierMatch[1]); }
      else if (currentTier > 0) { parsed.push({ name: line, tier: currentTier }); }
    }
    if (parsed.length === 0) { setMessage("No golfers parsed. Use format: Tier 1\\nName\\n..."); return; }
    const res = await fetch("/api/admin/golfers", { method: "POST", headers, body: JSON.stringify({ year_id: yearRecord.id, golfers: parsed }) });
    if (res.ok) { setMessage(`${parsed.length} golfers uploaded!`); loadData(); }
    else { const d = await res.json(); setMessage(`Error: ${d.error}`); }
  }

  async function togglePicksOpen() {
    if (!yearData) return;
    await fetch("/api/admin/year", { method: "POST", headers, body: JSON.stringify({ year: yearData.year, access_code: yearData.access_code, picks_open: !yearData.picks_open }) });
    loadData();
  }

  async function updateScore(golferId: string, field: string, value: string) {
    const numVal = value === "" ? null : Number(value);
    await fetch("/api/admin/scores", { method: "POST", headers, body: JSON.stringify({ golfer_id: golferId, [field]: numVal }) });
  }

  async function updateStatus(golferId: string, status: string) {
    await fetch("/api/admin/scores", { method: "POST", headers, body: JSON.stringify({ golfer_id: golferId, status }) });
  }

  async function togglePaid(participantId: string, currentPaid: boolean) {
    await fetch("/api/admin/payments", { method: "POST", headers, body: JSON.stringify({ participant_id: participantId, paid: !currentPaid }) });
    const res = await fetch(`/api/standings?year=${selectedYear}`);
    const data = await res.json();
    setParticipants((data.standings || []).map((s: { participant: Participant }) => s.participant));
  }

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-xl font-bold text-[var(--masters-green)] mb-4">Admin Login</h2>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4" placeholder="Admin password"
            onKeyDown={(e) => e.key === "Enter" && login()} />
          <button onClick={login} className="w-full bg-[var(--masters-green)] text-white py-2 rounded">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[var(--masters-green)]">Admin Panel</h2>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="border rounded px-3 py-2">
          {years.map((y) => <option key={y.year} value={y.year}>{y.year}</option>)}
        </select>
      </div>
      <div className="flex gap-2 mb-6">
        {(["setup", "scores", "payments"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded font-medium ${tab === t ? "bg-[var(--masters-green)] text-white" : "bg-gray-200 text-gray-700"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {message && <p className="bg-blue-50 text-blue-800 p-3 rounded mb-4">{message}</p>}

      {tab === "setup" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-3">Create / Update Year</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="number" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} className="border rounded px-3 py-2" placeholder="Year" />
              <input type="text" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="border rounded px-3 py-2" placeholder="Access code" />
            </div>
            <button onClick={createYear} className="bg-[var(--masters-green)] text-white px-4 py-2 rounded">Create Year</button>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-3">Upload Golfers for {selectedYear}</h3>
            <textarea value={golferText} onChange={(e) => setGolferText(e.target.value)}
              className="w-full border rounded px-3 py-2 h-48 font-mono text-sm"
              placeholder={"Tier 1\nScottie Scheffler\nRory McIlroy\n...\nTier 2\nWill Zalatoris\n..."} />
            <button onClick={uploadGolfers} className="bg-[var(--masters-green)] text-white px-4 py-2 rounded mt-2">Upload Golfers</button>
          </div>
          {yearData && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-3">Pick Submissions</h3>
              <button onClick={togglePicksOpen}
                className={`px-4 py-2 rounded font-medium ${yearData.picks_open ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
                {yearData.picks_open ? "Close Picks" : "Open Picks"}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "scores" && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--masters-green)] text-white">
              <tr>
                <th className="px-3 py-2 text-left">Golfer</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">R1</th>
                <th className="px-3 py-2">R2</th>
                <th className="px-3 py-2">R3</th>
                <th className="px-3 py-2">R4</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {golfers.map((g) => (
                <tr key={g.id} className="border-b">
                  <td className="px-3 py-1">{g.name}</td>
                  <td className="px-3 py-1 text-center">{g.tier}</td>
                  {(["day1_score", "day2_score", "day3_score", "day4_score"] as const).map((field) => (
                    <td key={field} className="px-1 py-1">
                      <input type="number" defaultValue={g[field] ?? ""} onBlur={(e) => updateScore(g.id, field, e.target.value)}
                        className="w-16 border rounded px-1 py-1 text-center text-sm" />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <select defaultValue={g.status} onChange={(e) => updateStatus(g.id, e.target.value)} className="border rounded px-1 py-1 text-sm">
                      <option value="active">Active</option>
                      <option value="cut">Cut</option>
                      <option value="wd">WD</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "payments" && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-[var(--masters-green)] text-white">
              <tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2">Paid</th></tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => togglePaid(p.id, p.paid)}
                      className={`px-3 py-1 rounded text-sm font-medium ${p.paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.paid ? "Paid $25" : "Not Paid"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
