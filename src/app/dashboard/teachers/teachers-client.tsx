'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import TeacherDialog, { ClassOption } from './teacher-dialog'
import {
  GraduationCap,
  UserPlus,
  Search,
  BookOpen,
  UserCheck,
  MoreVertical,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

export type TeacherItem = {
  id: string
  full_name: string | null
  role: string | null
  created_at: string | null
  assigned_classes?: {
    id: string
    name: string
    subject: string
    grade: string
  }[]
}

type TeachersClientProps = {
  initialTeachers: TeacherItem[]
  availableClasses: ClassOption[]
  isInstitution: boolean
}

export default function TeachersClient({
  initialTeachers,
  availableClasses,
  isInstitution,
}: TeachersClientProps) {
  const [teachers, setTeachers] = useState<TeacherItem[]>(initialTeachers)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase()
    const name = (t.full_name || '').toLowerCase()
    const id = t.id.toLowerCase()
    const classes = (t.assigned_classes || [])
      .map((c) => `${c.name} ${c.subject}`.toLowerCase())
      .join(' ')

    return name.includes(q) || id.includes(q) || classes.includes(q)
  })

  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Teaching Faculty</h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs px-2.5 py-0.5 font-semibold">
              {teachers.length} Active Staff
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Register teachers under your institution, manage assignments, and coordinate workloads.
          </p>
        </div>

        {isInstitution && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-10 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md shadow-emerald-200 transition-all hover:shadow-lg rounded-xl"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register Faculty Member
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search instructors by name or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-0 focus-visible:bg-white text-xs rounded-xl"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          Showing {filteredTeachers.length} of {teachers.length} instructors
        </span>
      </div>

      {/* Teachers Directory Card */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800">
            Instructor Roster
          </CardTitle>
          <span className="text-xs text-slate-400">Class assignments sync to mobile in real-time</span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-600 text-xs pl-6">Instructor Name</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Role</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Assigned Classes</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Status</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => {
                  const name = teacher.full_name || 'Instructor'
                  const initials = name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                  const isInstTeacher = teacher.role === 'institution_teacher'
                  const assigned = teacher.assigned_classes || []

                  return (
                    <TableRow key={teacher.id} className="hover:bg-emerald-50/20 transition-colors">
                      {/* Name & ID */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{name}</p>
                            <p className="text-xs text-slate-400 font-mono">
                              ID: {teacher.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {isInstTeacher ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200"
                          >
                            Institution Staff
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200"
                          >
                            Solo Instructor
                          </Badge>
                        )}
                      </TableCell>

                      {/* Assigned Classes */}
                      <TableCell>
                        {assigned.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {assigned.map((cls) => (
                              <Badge
                                key={cls.id}
                                variant="secondary"
                                className="text-[10px] bg-violet-50 text-violet-700 border border-violet-100 flex items-center gap-1"
                              >
                                <BookOpen className="h-2.5 w-2.5" />
                                {cls.name} ({cls.subject})
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No assigned classes</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <UserCheck className="h-3.5 w-3.5" />
                          Active
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleCopyId(teacher.id)}
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              {copiedId === teacher.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ID Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 text-slate-600" />
                                  Copy Instructor ID
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <Link href="/dashboard/classes">
                              <DropdownMenuItem className="text-xs cursor-pointer flex items-center gap-2">
                                <ExternalLink className="h-3.5 w-3.5 text-slate-600" />
                                Assign to a Class
                              </DropdownMenuItem>
                            </Link>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-slate-400">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-base font-semibold text-slate-700">No instructors found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'Try clearing your search query' : 'Register your first faculty member to assign them to classes.'}
                    </p>
                    {isInstitution && !search && (
                      <Button
                        onClick={() => setDialogOpen(true)}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Register Teacher
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teacher Registration Dialog */}
      <TeacherDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        availableClasses={availableClasses}
        onSuccess={() => {
          // Soft reload
        }}
      />
    </div>
  )
}
