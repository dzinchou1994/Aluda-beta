import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/rateLimit"

export async function POST(request: NextRequest) {
  try {
    // Check database connection first
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        { status: 503 }
      )
    }

    // Rate limit signup requests by IP
    await rateLimit({ key: `signup_${request.ip || 'unknown'}`, windowMs: 60_000, max: 10 })
    const { name, email, password } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "ყველა ველი სავალდებულოა" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს" },
        { status: 400 }
      )
    }

    // Check existing by email only
    let existing
    try {
      existing = await prisma.user.findFirst({
        where: { email: email.toLowerCase() }
      })
    } catch (dbError) {
      console.error("Database query failed:", dbError)
      return NextResponse.json(
        { error: "Database error. Please try again later." },
        { status: 503 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { error: "ელფოსტა ან მომხმარებლის სახელი უკვე გამოიყენება" },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    const slugify = (value: string) => {
      const base = (value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9\-ა-ჰ]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      return base || 'user'
    }

    const baseUsername = slugify(name)
    let candidate = baseUsername
    let counter = 0
    // Ensure uniqueness
    // Try base, then base-1, base-2, ...
    // Cap attempts to avoid infinite loop in pathological cases
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const exists = await prisma.user.findUnique({ where: { username: candidate } })
        if (!exists) break
        counter += 1
        candidate = `${baseUsername}-${counter}`
        if (counter > 1000) {
          throw new Error('Could not generate a unique username')
        }
      } catch (dbError) {
        console.error("Database query failed during username check:", dbError)
        return NextResponse.json(
          { error: "Database error. Please try again later." },
          { status: 503 }
        )
      }
    }

    let user
    try {
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          username: candidate,
          password: hashed,
        },
        select: { id: true, name: true, email: true, username: true }
      })
    } catch (dbError) {
      console.error("Database user creation failed:", dbError)
      return NextResponse.json(
        { error: "Failed to create user. Please try again later." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        message: "რეგისტრაცია წარმატებით დასრულდა",
        user
      },
      { status: 201 }
    )
  } catch (error: any) {
    // Handle unique constraint and common Prisma errors gracefully
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: "ელფოსტა ან მომხმარებლის სახელი უკვე გამოიყენება" },
        { status: 409 }
      )
    }

    console.error("Signup error:", error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? "სერვერის შეცდომა" : (error?.message || "სერვერის შეცდომა") },
      { status: 500 }
    )
  }
}
