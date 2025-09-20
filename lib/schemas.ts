import z from "zod";

export const formSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    phone: z
        .string()
        .min(10, "Phone number is too short")
        .max(15, "Phone number is too long"),
    department: z.string().min(1, "Department is required"),
    preferredShift: z.enum(["day", "night", "flexible"]),
    bio: z.string(),
    role: z.enum(["nurse", "admin"]),

});