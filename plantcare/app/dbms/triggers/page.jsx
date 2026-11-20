// app/dbms/triggers/page.jsx - PostgreSQL Trigger Visualizer & Event Flow
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Zap, ArrowRight, ArrowDown, Database, Bell, Activity,
  CheckCircle2, Play, Code2, RefreshCw, Layers
} from 'lucide-react';

const TRIGGER_DETAILS = [
  {
    id: 'trg_after_watering_insert',
    name: 'trg_after_watering_insert',
    table: 'watering_logs',
    event: 'AFTER INSERT',
    timing: 'AFTER',
    fn: 'fn_after_watering_insert()',
    flow: {
      eventText: 'User inserts a new record into watering_logs table',
      firedText: 'Trigger trg_after_watering_insert fires immediately on PostgreSQL engine',
      fnText: 'Calls calculate_plant_health_score(plant_id) to evaluate hydration cadence',
      effects: [
        'Updates plants.health_status to healthy, needs_attention, or critical',
        'Appends an entry to audit_logs table with plant_id and new health score'
      ]
    }
  },
  {
    id: 'trg_after_disease_record_insert',
    name: 'trg_after_disease_record_insert',
    table: 'disease_records',
    event: 'AFTER INSERT',
    timing: 'AFTER',
    fn: 'fn_after_disease_record_insert()',
    flow: {
      eventText: 'A plant is diagnosed with a disease in disease_records',
      firedText: 'Trigger trg_after_disease_record_insert activates',
      fnText: 'Looks up disease pathology, user ownership, and diagnosis severity',
      effects: [
        'Automatically creates an urgent record in notifications table for the user',
        'Downgrades plants.health_status to critical if severity is severe/critical',
        'Writes diagnosis event to audit_logs'
      ]
    }
  },
  {
    id: 'trg_after_growth_log_insert',
    name: 'trg_after_growth_log_insert',
    table: 'growth_logs',
    event: 'AFTER INSERT',
    timing: 'AFTER',
    fn: 'fn_after_growth_log_insert()',
    flow: {
      eventText: 'Height or leaf count measured and logged into growth_logs',
      firedText: 'Trigger trg_after_growth_log_insert fires',
      fnText: 'Compares new growth stage with old growth stage of the plant',
      effects: [
        'Updates plants.growth_stage in the plants table',
        'Generates milestone notification: "Growth Milestone Reached!"',
        'Records measurement snapshot in audit_logs'
      ]
    }
  },
  {
    id: 'trg_after_health_log_insert',
    name: 'trg_after_health_log_insert',
    table: 'health_logs',
    event: 'AFTER INSERT',
    timing: 'AFTER',
    fn: 'fn_after_health_log_insert()',
    flow: {
      eventText: 'Manual visual inspection logged into health_logs with score 0-100',
      firedText: 'Trigger trg_after_health_log_insert fires',
      fnText: 'Maps numeric score to categorical health_status (healthy / attention / critical)',
      effects: [
        'Synchronizes plants.health_status column',
        'If score < 30, dispatches high-priority alert to notifications table'
      ]
    }
  },
  {
    id: 'trg_after_plant_insert',
    name: 'trg_after_plant_insert',
    table: 'plants',
    event: 'AFTER INSERT',
    timing: 'AFTER',
    fn: 'fn_after_plant_insert()',
    flow: {
      eventText: 'New plant entity inserted into plants table',
      firedText: 'Trigger trg_after_plant_insert fires',
      fnText: 'Prepares welcome notification and records plant creation',
      effects: [
        'Inserts welcome guide into notifications table',
        'Inserts creation tuple into audit_logs table'
      ]
    }
  }
];

export default function TriggersPage() {
  const [triggers, setTriggers] = useState([]);
  const [selectedTrg, setSelectedTrg] = useState(TRIGGER_DETAILS[0]);
  const [activeStep, setActiveStep] = useState(4);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    async function loadTriggers() {
      try {
        const res = await fetch('/api/db/triggers');
        if (res.ok) {
          const data = await res.json();
          setTriggers(data.triggers || data || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadTriggers();
  }, []);

  function handleSimulate() {
    setAnimating(true);
    setActiveStep(1);
    setTimeout(() => setActiveStep(2), 700);
    setTimeout(() => setActiveStep(3), 1500);
    setTimeout(() => {
      setActiveStep(4);
      setAnimating(false);
    }, 2300);
  }

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(201, 147, 58, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Zap size={24} style={{ color: 'var(--amber)' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Database Trigger Visualizer
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(201,147,58,0.15)', color: 'var(--amber)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              Event-Driven Automation Engine
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
            Visualizes real PostgreSQL triggers defined in <code>database/triggers.sql</code>. Demonstrates how database events (INSERT) automatically cascade into side-effects like health recalculation, audit logs, and notification generation without application layer polling.
          </p>
        </div>

        {/* Master Detail Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
          {/* Left Trigger Selector */}
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '16px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Active Database Triggers ({TRIGGER_DETAILS.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {TRIGGER_DETAILS.map(t => {
                const isSelected = selectedTrg.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTrg(t); setActiveStep(4); }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--amber)' : 'transparent',
                      background: isSelected ? 'rgba(201, 147, 58, 0.15)' : 'rgba(0,0,0,0.2)',
                      color: isSelected ? 'var(--amber)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: isSelected ? 'var(--text-primary)' : 'inherit', fontFamily: 'var(--font-mono)' }}>
                        {t.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ON {t.table} &bull; {t.event}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Interactive Event Flow */}
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--amber)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Event Pipeline Architecture
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
                  {selectedTrg.name}
                </h2>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSimulate}
                disabled={animating}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--amber)', color: '#000', fontWeight: 700 }}
              >
                <Play size={16} />
                <span>Simulate Event Flow</span>
              </button>
            </div>

            {/* Pipeline Stage 1: Database Event */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              {/* Step 1 */}
              <div
                style={{
                  background: activeStep >= 1 ? 'rgba(74, 154, 191, 0.15)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${activeStep >= 1 ? '#4a9abf' : 'var(--border)'}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#4a9abf', fontWeight: 700, textTransform: 'uppercase' }}>
                    Stage 1: Primary Database Write Event
                  </span>
                  {activeStep >= 1 && <CheckCircle2 size={16} style={{ color: '#4a9abf' }} />}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedTrg.flow.eventText}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  Target Relation: {selectedTrg.table}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowDown size={20} style={{ color: activeStep >= 2 ? 'var(--amber)' : 'var(--text-muted)' }} />
              </div>

              {/* Step 2 */}
              <div
                style={{
                  background: activeStep >= 2 ? 'rgba(201, 147, 58, 0.15)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${activeStep >= 2 ? 'var(--amber)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Stage 2: PostgreSQL Trigger Fires
                  </span>
                  {activeStep >= 2 && <Zap size={16} style={{ color: 'var(--amber)' }} />}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedTrg.flow.firedText}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  Timing: {selectedTrg.timing} &bull; Trigger: {selectedTrg.name}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowDown size={20} style={{ color: activeStep >= 3 ? 'var(--green-primary)' : 'var(--text-muted)' }} />
              </div>

              {/* Step 3 */}
              <div
                style={{
                  background: activeStep >= 3 ? 'rgba(134, 188, 66, 0.15)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${activeStep >= 3 ? 'var(--green-primary)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--green-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Stage 3: Trigger Function Executes (PL/pgSQL)
                  </span>
                  {activeStep >= 3 && <Activity size={16} style={{ color: 'var(--green-primary)' }} />}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedTrg.flow.fnText}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  Function: {selectedTrg.fn}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowDown size={20} style={{ color: activeStep >= 4 ? 'var(--green-primary)' : 'var(--text-muted)' }} />
              </div>

              {/* Step 4 */}
              <div
                style={{
                  background: activeStep >= 4 ? 'rgba(134, 188, 66, 0.1)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${activeStep >= 4 ? 'rgba(134, 188, 66, 0.4)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--green-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Stage 4: Cascaded Relational Changes (Atomic)
                  </span>
                  {activeStep >= 4 && <CheckCircle2 size={16} style={{ color: 'var(--green-primary)' }} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedTrg.flow.effects.map((eff, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-primary)' }} />
                      <span>{eff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
