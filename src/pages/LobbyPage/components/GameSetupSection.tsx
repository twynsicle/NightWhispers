import { useState } from 'react'
import { Collapse, Select } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import styles from './GameSetupSection.module.css'

interface GameSetupSectionProps {
  script: string
  onScriptChange: (value: string) => void
}

/**
 * Collapsible game setup section for Storyteller.
 *
 * Contains script selector (disabled in v1, supports only "None").
 */
export function GameSetupSection({
  script,
  onScriptChange,
}: GameSetupSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        aria-expanded={isOpen}
        aria-controls="game-setup-content"
      >
        <span className={styles.title}>Game Setup</span>
        <IconChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </div>

      <Collapse in={isOpen}>
        <div id="game-setup-content" className={styles.content}>
          <Select
            label="Script"
            description="Select game script (v1 supports None only)"
            data={[{ value: 'none', label: 'None (No Roles)' }]}
            value={script}
            onChange={value => onScriptChange(value || 'none')}
            disabled
          />
        </div>
      </Collapse>
    </div>
  )
}
