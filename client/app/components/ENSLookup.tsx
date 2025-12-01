'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ETH_RPC_URL),
})

interface ENSProfile {
  name: string
  address: string | null
  avatar: string | null
  records: Record<string, string>
}

const TEXT_RECORD_KEYS = [
  'email',
  'url',
  'description',
  'notice',
  'keywords',
  'com.twitter',
  'com.github',
  'com.discord',
  'org.telegram',
  'io.keybase',
  'avatar',
  'header',
  'name',
  'location',
]

// Default avatar as base64 data URI
const DEFAULT_AVATAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAADy0lEQVR4AeycPY7UQBCFzZyAiLsRIBFDTsYhEOIEBByGEIlDEHGDRR04sbDa41fd9dMfUms0Y1fVq/c+nMzuPj5/+vminN+/3r8oR5ldoVbxrtWqHjw2/i3tAAAsHf+2AQAALO7A4uvzBACAxR1YfH2eAIsCsK8NALsTi74CwKLB72sDwO7Eoq8AsGjw+9oAsDux6CsALBr8vjYA7E4s+goAiwV/XPfx9t23TTnHhs++V2a32mfnWd/fNChH1aPMbrU8AdQEktcDQPIAVfkAoDqYvB4AkgeoygcA1cHk9QCQPEBVPgCoDiapP5MJAGfOLPI5ACwS9NmaAHDmzCKfA8AiQZ+tCQBnzizyOQAsEvTZmgBw5swinwNA8aB76z1+fP+4Kac3oHddmd1q23fanqdpUE7Pn951ZXar5QnQc7j4dQAoHnBvPQDoOVT8OgAUD7i3HgD0HCp+HQCKB9xbDwB6DiW9flU2AFx1quh9AFA02KtrAcBVp4reBwBFg726FgBcdarofQBQNNirawHAVaeK3gcAxYJ9dh33vw/wrODj/e07bc9z1DP7vfqzEDwBZicWbB4ABAtkthwAmO14sHkAECyQ2XIAYLbjweYBQLBAZssBgNmOD5p3ty0A3HWuSB0AFAny7hoAcNe5InUAUCTIu2sAwF3nitQBQJEg764BAHedK1IHAMmDVOU/3rx+tSlHFaB+n529XvVPya7V8gRQE0heDwDJA1TlA4DqYPJ6AEgeoCofAFQHk9cDQPIAVfkAoDroVG81FgCsnEzaBwCSBmclGwCsnEzaBwCSBmclGwCsnEzaBwCSBmclGwCsnEzaBwCSBWct9/Hn78umnPadsnI8f7c/wmzFu1arZNdqeQJY/5dK1g8AkgVmLRcArB1N1g8AkgVmLRcArB1N1g8AkgVmLRcArB0d1G9UWwAY5WySvgCQJKhRMgFglLNJ+gJAkqBGyQSAUc4m6QsASYIaJRMARjmbpC8ABA9qtDwZgC9fP2zKGb1g9P6Kd61W3U8GQBVAva8DAODrv/t0AHCPwFcAAPj67z4dANwj8BUAAL7+u08HAPcI/i9g1qcAMMvpoHMAIGgws2QBwCyng84BgKDBzJIFALOcDjoHAIIGM0sWAMxyOugcAAgWzGw5MgDef69/tmHHedn3lwE4GsL7XA4AQK68zNUCgLmluRoCQK68zNUCgLmluRoCQK68zNUCgLml9xp6VQGAl/NB5gJAkCC8ZACAl/NB5gJAkCC8ZACAl/NB5gJAkCC8ZACAl/NB5gKAcxDe4/8BAAD///YpzMYAAAAGSURBVAMAq2hb3cvhRQQAAAAASUVORK5CYII='

export default function ENSLookup() {
  const searchParams = useSearchParams()
  const [ensName, setEnsName] = useState('')
  const [profile, setProfile] = useState<ENSProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notRegistered, setNotRegistered] = useState<string | null>(null)

  const lookupENS = useCallback(async (nameToLookup?: string) => {
    const name = nameToLookup || ensName
    if (!name.trim()) return

    setLoading(true)
    setError(null)
    setProfile(null)
    setNotRegistered(null)

    try {
      const fullName = name.trim().toLowerCase().endsWith('.eth')
        ? name.trim().toLowerCase()
        : `${name.trim().toLowerCase()}.eth`
      const normalizedName = normalize(fullName)

      // Fetch address first (required to continue)
      const address = await client.getEnsAddress({ name: normalizedName })

      if (!address) {
        setNotRegistered(normalizedName)
        setLoading(false)
        return
      }

      // Fetch avatar and all text records in parallel
      const [avatar, ...textResults] = await Promise.all([
        client.getEnsAvatar({ name: normalizedName }).catch(() => null),
        ...TEXT_RECORD_KEYS.map(key =>
          client.getEnsText({ name: normalizedName, key })
            .then(value => ({ key, value }))
            .catch(() => ({ key, value: null }))
        ),
      ])

      // Build records object from results
      const records: Record<string, string> = {}
      for (const result of textResults) {
        if (result.value) {
          records[result.key] = result.value
        }
      }

      setProfile({
        name: normalizedName,
        address,
        avatar,
        records,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup ENS name')
    } finally {
      setLoading(false)
    }
  }, [ensName])

  // Auto-lookup from URL params (when clicking from graph)
  useEffect(() => {
    const ensParam = searchParams.get('ens')
    if (ensParam) {
      setEnsName(ensParam)
      lookupENS(ensParam)
    }
  }, [searchParams, lookupENS])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    lookupENS()
  }

  const formatRecordKey = (key: string) => {
    const keyMap: Record<string, string> = {
      'com.twitter': 'Twitter',
      'com.github': 'GitHub',
      'com.discord': 'Discord',
      'org.telegram': 'Telegram',
      'io.keybase': 'Keybase',
    }
    return keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1)
  }

  const getRecordLink = (key: string, value: string) => {
    const linkMap: Record<string, string> = {
      'com.twitter': `https://twitter.com/${value.replace('@', '')}`,
      'com.github': `https://github.com/${value}`,
      'url': value.startsWith('http') ? value : `https://${value}`,
      'email': `mailto:${value}`,
    }
    return linkMap[key]
  }

  const getFullEnsName = (name: string) => {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) return ''
    if (trimmed.endsWith('.eth')) return trimmed
    return `${trimmed}.eth`
  }

  const showSuffix = !ensName.toLowerCase().endsWith('.eth')

  return (
    <div className="ens-lookup">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={ensName}
            onChange={(e) => setEnsName(e.target.value)}
            placeholder="vitalik"
            className="search-input"
          />
          {showSuffix && <span className="search-input-suffix">.eth</span>}
        </div>
        <button type="submit" disabled={loading} className="search-button">
          {loading ? 'Looking up...' : 'Lookup'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {notRegistered && (
        <div className="not-registered-card">
          <div className="not-registered-icon">?</div>
          <h3>{notRegistered}</h3>
          <p>This ENS name is not registered yet.</p>
          <a
            href={`https://app.ens.domains/${notRegistered}/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="register-button"
          >
            Register on ENS
          </a>
        </div>
      )}

      {profile && (
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-header-content">
              <img src={profile.avatar || DEFAULT_AVATAR} alt={profile.name} className="profile-avatar" />
              <div className="profile-name-section">
                <h2 className="profile-name">{profile.name}</h2>
                {profile.records.name && (
                  <p className="profile-display-name">{profile.records.name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-section">
              <h3>Address</h3>
              <p className="address">{profile.address}</p>
            </div>

            {profile.records.description && (
              <div className="profile-section">
                <h3>Description</h3>
                <p>{profile.records.description}</p>
              </div>
            )}

            {profile.records.location && (
              <div className="profile-section">
                <h3>Location</h3>
                <p>{profile.records.location}</p>
              </div>
            )}

            {Object.keys(profile.records).filter(k => !['description', 'name', 'avatar', 'header', 'location'].includes(k)).length > 0 && (
              <div className="profile-section">
                <h3>Links & Socials</h3>
                <div className="records-grid">
                  {Object.entries(profile.records)
                    .filter(([key]) => !['description', 'name', 'avatar', 'header', 'location'].includes(key))
                    .map(([key, value]) => {
                      const link = getRecordLink(key, value)
                      return (
                        <div key={key} className="record-item">
                          <span className="record-key">{formatRecordKey(key)}</span>
                          {link ? (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="record-value record-link">
                              {value}
                            </a>
                          ) : (
                            <span className="record-value">{value}</span>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
