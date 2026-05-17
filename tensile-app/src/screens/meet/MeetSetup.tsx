import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AppHeader, PrimaryBtn, TabBar, T } from '../../shared';
import { useStore } from '../../store';

const federationsList = ['IPF', 'USAPL', 'WRPF'];
const equipmentList = ['Raw', 'Wraps', 'Equipped'];
const weightClasses = ['74', '83', '93', '105'];

export default function MeetSetup() {
  const navigate = useNavigate();
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);
  const [federation, setFederation] = useState(profile.federation || 'IPF');
  const [equipment, setEquipment] = useState(profile.equipment || 'Raw');
  const [weightClass, setWeightClass] = useState(profile.weightClass || '83');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [meetDate, setMeetDateState] = useState(profile.meetDate || '2026-09-14');

  const bodyWeight = profile.bodyWeight ?? 84.5;

  const dateObj = new Date(meetDate + 'T00:00:00');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear()).slice(-2);
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayName = dayNames[dateObj.getDay()];
  const weeksOut = Math.max(0, Math.ceil((dateObj.getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)));

  return (
    <Phone>
      <AppHeader eyebrow="Competition · Setup" title="Meet day" back onBack={() => navigate('/')} right={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 11 }}>{profile.sex ? profile.sex[0] : 'U'}</div>
          <button type="button" aria-label="Settings" onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09A1.65 1.65 0 0019.4 15z"/>
            </svg>
          </button>
        </div>
      } />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 14px' }}>
        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Meet date
        </div>
        <div
          style={{
            border: `1px solid ${T.line}`,
            padding: '18px 18px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setIsEditingDate(true)}
        >
          {isEditingDate ? (
            <input
              type="date"
              value={meetDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setMeetDateState(newDate);
                setProfile({ meetDate: newDate });
              }}
              onBlur={() => setIsEditingDate(false)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                color: T.text,
                fontFamily: T.serif,
                fontSize: 32,
                outline: 'none',
                width: '100%',
              }}
            />
          ) : (
            <div>
              <div className="tns-serif" style={{ fontSize: 46, lineHeight: 0.9 }}>
                {day} · {month} · {year}
              </div>
              <div
                className="tns-mono"
                style={{ fontSize: 11, color: T.textMute, marginTop: 6, letterSpacing: '0.06em' }}
              >
                {dayName} · {weeksOut} WEEKS OUT
              </div>
            </div>
          )}
          <span
            style={{ color: T.accent, fontSize: 22, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingDate(true);
            }}
          >
            ✎
          </span>
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Federation
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 18 }}>
          {federationsList.map((l) => (
            <div
              key={l}
              onClick={() => { setFederation(l); setProfile({ federation: l }); }}
              style={{
                border: `1px solid ${federation === l ? T.accent : T.line}`,
                background: federation === l ? 'rgba(255,110,58,0.06)' : 'transparent',
                padding: '12px 0',
                textAlign: 'center',
                fontFamily: T.mono,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {l}
            </div>
          ))}
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Weight class
        </div>
        <div style={{ border: `1px solid ${T.line}`, padding: '14px 16px', marginBottom: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span className="tns-mono" style={{ fontSize: 18 }}>
              {weightClass} kg
            </span>
            <span className="tns-mono" style={{ fontSize: 11, color: T.textMute, letterSpacing: '0.06em' }}>
              CURRENT {bodyWeight}
            </span>
          </div>
          <div style={{ height: 4, background: T.surface, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${(weightClasses.indexOf(weightClass) + 1) * 25}%`, background: T.accent }} />
            <div style={{ position: 'absolute', left: '62%', top: -4, width: 2, height: 12, background: T.caution }} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontFamily: T.mono,
              fontSize: 9,
              color: T.textMute,
            }}
          >
            {weightClasses.map((wc) => (
              <span key={wc} onClick={() => { setWeightClass(wc); setProfile({ weightClass: wc }); }} style={{ cursor: 'pointer', color: weightClass === wc ? T.text : T.textMute }}>{wc}</span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.5, marginBottom: 22 }}>
          Cut <span className="tns-mono">{Math.max(0, bodyWeight - Number(weightClass)).toFixed(1)} kg</span> by meet day — within passive water-cut range.
        </div>

        <div className="tns-eyebrow" style={{ marginBottom: 10 }}>
          Equipment
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {equipmentList.map((l) => (
            <div
              key={l}
              onClick={() => { setEquipment(l); setProfile({ equipment: l }); }}
              style={{
                flex: 1,
                border: `1px solid ${equipment === l ? T.accent : T.line}`,
                background: equipment === l ? 'rgba(255,110,58,0.06)' : 'transparent',
                padding: '11px 0',
                textAlign: 'center',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 22px 0', borderTop: `1px solid ${T.lineSoft}` }}>
        <PrimaryBtn onClick={() => { setProfile({ meetDate, federation, equipment, weightClass }); navigate('/meet/peaking'); }}>Generate peaking plan →</PrimaryBtn>
      </div>
      <TabBar
        active="meet"
        onNavigate={(id) => {
          if (id === 'today') navigate('/');
          else if (id === 'block') navigate('/block/performance');
          else if (id === 'lifts') navigate('/lifts');
          else if (id === 'meet') navigate('/meet/setup');
          else navigate('/');
        }}
      />
    </Phone>
  );
}
