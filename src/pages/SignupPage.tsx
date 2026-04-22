import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Heart } from "lucide-react";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupForm) => {
    setLoading(true);
    setError(null);
    try {
      await signUp(values.email, values.password, values.fullName);
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm text-center p-8">
          <Heart className="h-10 w-10 fill-primary text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We sent a confirmation link to your inbox. Click it to activate your
            account.
          </p>
          <Link to="/login" className="text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Heart className="h-8 w-8 fill-primary text-primary" />
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-muted-foreground">
            Start finding the right therapist today
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sign up</CardTitle>
            <CardDescription>Free to create an account</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  placeholder="Jane Smith"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" {...register("confirm")} />
                {errors.confirm && (
                  <p className="text-xs text-destructive">
                    {errors.confirm.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create account
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
