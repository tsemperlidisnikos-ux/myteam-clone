import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";

const API = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function App() {
  const [token, setToken] = useState("");
  const [clubId, setClubId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [screen, setScreen] = useState("trainings");
  const [trainings, setTrainings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchStats, setMatchStats] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const api = useMemo(
    () =>
      axios.create({
        baseURL: API,
        headers: authHeaders(token),
      }),
    [token]
  );

  const loadMatches = async (t, cId, tmId) => {
    const res = await axios.get(`${API}/matches/${cId}?team_id=${tmId}`, {
      headers: authHeaders(t || token),
    });
    setMatches(res.data);
    return res.data;
  };

  const loadTrainings = async (t, cId, tmId) => {
    const res = await axios.get(`${API}/trainings/${cId}?team_id=${tmId}`, {
      headers: authHeaders(t || token),
    });
    setTrainings(res.data);
    return res.data;
  };

  const pickTeamWithTrainings = async (t, cId, teamList) => {
    for (const team of teamList) {
      const list = await loadTrainings(t, cId, team.id);
      if (list.length > 0) {
        setTeamId(String(team.id));
        return;
      }
    }
    if (teamList[0]) {
      setTeamId(String(teamList[0].id));
      setTrainings([]);
    }
  };

  const login = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const t = res.data.token;
      const club = res.data.clubs?.[0];
      if (!club) {
        setError("No club on this account");
        return;
      }
      setToken(t);
      setClubId(String(club.club_id));

      const teamsRes = await axios.get(`${API}/teams/${club.club_id}`, {
        headers: authHeaders(t),
      });
      const teamList = teamsRes.data || [];
      setTeams(teamList);
      await pickTeamWithTrainings(t, club.club_id, teamList);
      if (teamList[0]) await loadMatches(t, club.club_id, teamList.find((tm) => String(tm.id) === String(teamId))?.id || teamList[0].id);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Login failed";
      if (err.code === "ERR_NETWORK" || msg.includes("Network")) {
        setError(
          `Δεν συνδέεται στο backend.\nAPI: ${API}\nΊδιο Wi‑Fi με PC; Backend τρέχει;`
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTeam = async (id) => {
    setTeamId(String(id));
    setLoading(true);
    try {
      await Promise.all([
        loadTrainings(token, clubId, id),
        loadMatches(token, clubId, id),
      ]);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openMatch = async (match) => {
    setSelectedMatch(match);
    setLoading(true);
    try {
      const [statsRes, teamRes] = await Promise.all([
        api.get(`/matches/${clubId}/${match.id}/stats`),
        api.get(`/teams/${clubId}/${match.team_id}`),
      ]);
      const roster = teamRes.data.athletes || [];
      const statsMap = Object.fromEntries(
        statsRes.data.map((s) => [s.athlete_id, s.points ?? 0])
      );
      setMatchStats(
        roster.map((a) => ({
          id: a.id,
          name: a.full_name,
          points: statsMap[a.id] ?? 0,
        }))
      );
    } catch {
      setError("Failed to load match stats");
    } finally {
      setLoading(false);
    }
  };

  const saveMatchStat = async (athleteId, points) => {
    try {
      await api.post(`/matches/${clubId}/${selectedMatch.id}/stats`, {
        athlete_id: athleteId,
        points: Number(points) || 0,
        minutes_played: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
      });
    } catch {
      setError("Failed to save stat");
    }
  };

  const openTraining = async (training) => {
    setSelectedTraining(training);
    setLoading(true);
    try {
      const res = await api.get(`/trainings/${clubId}/${training.id}/attendance`);
      setAttendance(res.data);
    } catch {
      setError("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const mark = async (athleteId, status) => {
    try {
      await api.post(`/trainings/${clubId}/${selectedTraining.id}/attendance`, {
        athlete_id: athleteId,
        status,
      });
      const res = await api.get(`/trainings/${clubId}/${selectedTraining.id}/attendance`);
      setAttendance(res.data);
    } catch {
      setError("Failed to update attendance");
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>MyTeam Mobile</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.btn} onPress={login} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Login</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.hint}>API: {API}</Text>
        <Text style={styles.hint}>
          Κινητό + PC στο ίδιο Wi‑Fi. Αν δεν ανοίγει, τρέξε: npm run start:tunnel
        </Text>
      </SafeAreaView>
    );
  }

  if (selectedMatch) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedMatch(null)}>
          <Text style={styles.link}>← Πίσω</Text>
        </TouchableOpacity>
        <Text style={styles.title}>vs {selectedMatch.opponent}</Text>
        <ScrollView>
          {matchStats.map((a) => (
            <View key={a.id} style={styles.row}>
              <Text style={styles.name}>{a.name}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(a.points)}
                onChangeText={(v) =>
                  setMatchStats((prev) =>
                    prev.map((x) => (x.id === a.id ? { ...x, points: v } : x))
                  )
                }
                onBlur={() => saveMatchStat(a.id, a.points)}
              />
              <Text>PTS</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (selectedTraining) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedTraining(null)}>
          <Text style={styles.link}>← Πίσω</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Παρουσίες</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <ScrollView>
            {attendance.length === 0 ? (
              <Text>Δεν υπάρχουν αθλητές σε αυτή την ομάδα.</Text>
            ) : (
              attendance.map((a) => (
                <View key={a.id} style={styles.row}>
                  <Text style={styles.name}>{a.full_name}</Text>
                  <View style={styles.actions}>
                    {["present", "absent", "late"].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.chip, a.status === s && styles.chipActive]}
                        onPress={() => mark(a.id, s)}
                      >
                        <Text>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  const activeTeam = teams.find((t) => String(t.id) === String(teamId));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, screen === "trainings" && styles.tabActive]}
          onPress={() => setScreen("trainings")}
        >
          <Text>Προπονήσεις</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, screen === "matches" && styles.tabActive]}
          onPress={() => setScreen("matches")}
        >
          <Text>Αγώνες</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{screen === "trainings" ? "Προπονήσεις" : "Αγώνες"}</Text>
      {teams.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamRow}>
          {teams.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.teamChip, String(t.id) === String(teamId) && styles.chipActive]}
              onPress={() => switchTeam(t.id)}
            >
              <Text>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {activeTeam ? (
        <Text style={styles.subtitle}>{activeTeam.name}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator size="large" />
      ) : screen === "matches" ? (
        matches.length === 0 ? (
          <Text>Δεν υπάρχουν αγώνες.</Text>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => openMatch(item)}>
                <Text style={styles.cardDate}>
                  {item.date?.slice?.(0, 10) ?? item.date} vs {item.opponent}
                </Text>
                <Text>
                  {item.our_score != null ? `${item.our_score}–${item.opponent_score}` : "—"}
                </Text>
              </TouchableOpacity>
            )}
          />
        )
      ) : trainings.length === 0 ? (
        <Text>Δεν υπάρχουν προπονήσεις για αυτή την ομάδα.</Text>
      ) : (
        <FlatList
          data={trainings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openTraining(item)}>
              <Text style={styles.cardDate}>
                {item.date?.slice?.(0, 10) ?? item.date}
                {item.start_time ? ` · ${String(item.start_time).slice(0, 5)}` : ""}
              </Text>
              <Text>{item.location || "—"}</Text>
              {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f3f4f6" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  subtitle: { color: "#6b7280", marginBottom: 12 },
  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  btn: { backgroundColor: "#111827", padding: 14, borderRadius: 8, alignItems: "center" },
  btnText: { color: "white", fontWeight: "600" },
  hint: { marginTop: 12, color: "#6b7280", fontSize: 12 },
  error: { color: "#dc2626", marginBottom: 10 },
  teamRow: { marginBottom: 8, maxHeight: 44 },
  teamChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 8,
  },
  card: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardDate: { fontWeight: "600", marginBottom: 4 },
  cardNotes: { color: "#6b7280", marginTop: 4, fontSize: 12 },
  link: { color: "#2563eb", marginBottom: 12 },
  row: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: { fontWeight: "600", marginBottom: 8 },
  actions: { flexDirection: "row" },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 6,
  },
  chipActive: { backgroundColor: "#dbeafe" },
  tabRow: { flexDirection: "row", marginBottom: 12, gap: 8 },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  tabActive: { backgroundColor: "#dbeafe" },
});
