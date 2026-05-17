import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store';
import { T } from './shared';

// Onboarding
import Welcome from './screens/onboarding/Welcome';
import Biometrics from './screens/onboarding/Biometrics';
import Baselines from './screens/onboarding/Baselines';
import WeakPoint from './screens/onboarding/WeakPoint';
import History from './screens/onboarding/History';
import Schedule from './screens/onboarding/Schedule';
import FirstBlock from './screens/onboarding/FirstBlock';

// Session
import Today from './screens/session/Today';
import UpcomingSessions from './screens/session/UpcomingSessions';
import SessionPreview from './screens/session/SessionPreview';
import Wellness from './screens/session/Wellness';
import ReadinessBrief from './screens/session/ReadinessBrief';
import Warmup from './screens/session/Warmup';
import TopSet from './screens/session/TopSet';
import DropProtocol from './screens/session/DropProtocol';
import Summary from './screens/session/Summary';
import Override from './screens/session/Override';
import VbtCalibration from './screens/session/VbtCalibration';

// Block Review
import Performance from './screens/block/Performance';
import Volume from './screens/block/Volume';
import Readiness from './screens/block/Readiness';
import WeakPointReview from './screens/block/WeakPointReview';
import Audit from './screens/block/Audit';
import NextBlock from './screens/block/NextBlock';

// Deload
import DeloadRec from './screens/deload/DeloadRec';
import DeloadStructure from './screens/deload/DeloadStructure';
import Pivot from './screens/deload/Pivot';

// Plan
import PlanEditor from './screens/plan/PlanEditor';

// Lifts
import LiftsLibrary from './screens/lifts/LiftsLibrary';

// Meet
import MeetSetup from './screens/meet/MeetSetup';
import Peaking from './screens/meet/Peaking';
import Attempts from './screens/meet/Attempts';

// Settings
import Settings from './screens/Settings';

function App() {
  const navigate = useNavigate();
  const onboardingComplete = useStore(s => s.onboardingComplete);
  const currentBlock = useStore(s => s.currentBlock);
  const currentSession = useStore(s => s.currentSession);
  const setCurrentSession = useStore(s => s.setCurrentSession);

  // Restore in-progress session on mount (currentSession is not persisted)
  useEffect(() => {
    if (!currentBlock) return;
    const inProgress = currentBlock.sessions.find(s => s.status === 'IN_PROGRESS');
    if (inProgress) {
      setCurrentSession(inProgress);
    }
  }, [currentBlock, setCurrentSession]);

  return (
    <><Routes>
      {!onboardingComplete ? (
        <>
          <Route path="/" element={<Welcome />} />
          <Route path="/onboarding/biometrics" element={<Biometrics />} />
          <Route path="/onboarding/baselines" element={<Baselines />} />
          <Route path="/onboarding/weak-point" element={<WeakPoint />} />
          <Route path="/onboarding/history" element={<History />} />
          <Route path="/onboarding/schedule" element={<Schedule />} />
          <Route path="/onboarding/first-block" element={<FirstBlock />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Today />} />
          <Route path="/sessions" element={<UpcomingSessions />} />
          <Route path="/session/preview/:sessionId" element={<SessionPreview />} />
          <Route path="/session/wellness" element={<Wellness />} />
          <Route path="/session/readiness" element={<ReadinessBrief />} />
          <Route path="/session/warmup" element={<Warmup />} />
          <Route path="/session/topset" element={<TopSet />} />
          <Route path="/session/drop" element={<DropProtocol />} />
          <Route path="/session/summary" element={<Summary />} />
          <Route path="/session/override" element={<Override />} />
          <Route path="/session/vbt-calibration" element={<VbtCalibration />} />
          <Route path="/lifts" element={<LiftsLibrary />} />
          <Route path="/block/performance" element={<Performance />} />
          <Route path="/block/volume" element={<Volume />} />
          <Route path="/block/readiness" element={<Readiness />} />
          <Route path="/block/weakpoint" element={<WeakPointReview />} />
          <Route path="/block/audit" element={<Audit />} />
          <Route path="/block/next" element={<NextBlock />} />
          <Route path="/plan/edit" element={<PlanEditor />} />
          <Route path="/deload/rec" element={<DeloadRec />} />
          <Route path="/deload/structure" element={<DeloadStructure />} />
          <Route path="/deload/pivot" element={<Pivot />} />
          <Route path="/meet/setup" element={<MeetSetup />} />
          <Route path="/meet/peaking" element={<Peaking />} />
          <Route path="/meet/attempts" element={<Attempts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
    {currentSession?.status === 'IN_PROGRESS' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: T.accent,
          color: '#1a0f08',
          padding: '10px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: T.mono,
          fontSize: 11,
          letterSpacing: '0.06em',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: '#1a0f08' }} />
            WORKOUT IN PROGRESS · {currentSession.exercises?.[currentSession.currentExerciseIndex || 0]?.name || 'Session'}
          </span>
          <button
            type="button"
            onClick={() => {
              const exIdx = currentSession.currentExerciseIndex || 0;
              const currentEx = currentSession.exercises?.[exIdx];
              if (!currentEx) {
                navigate('/session/warmup');
                return;
              }
              const exSets = currentSession.sets.filter(s => s.exerciseId === currentEx.id);
              const hasTopSet = exSets.some(s => s.setType === 'TOP_SET');
              const hasBackOff = exSets.some(s => s.setType === 'BACK_OFF');
              if (!hasTopSet) { navigate('/session/topset'); return; }
              if (hasBackOff) {
                const lastBackOff = [...exSets].reverse().find(s => s.setType === 'BACK_OFF');
                if (lastBackOff && lastBackOff.actualRpe >= lastBackOff.prescribedRpeTarget) {
                  navigate('/session/summary');
                } else {
                  navigate('/session/drop');
                }
              } else {
                navigate('/session/drop');
              }
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 11, color: '#1a0f08', fontWeight: 600 }}
          >
            RESUME →
          </button>
        </div>
      )}
  </>
  );
}

export default App;
