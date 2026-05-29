import React from 'react'

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="border bg-card">
      {children}
    </div>
  )
}

export default TableWrapper
