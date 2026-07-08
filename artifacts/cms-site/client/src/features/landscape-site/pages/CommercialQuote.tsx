import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getPage } from "@/features/landscape-site/content/pages";
import { useLandscapeCmsPage } from "@/features/landscape-site/use-landscape-cms";
import { Seo } from "@/features/landscape-site/components/Seo";
import { COMMERCIAL_SERVICE_OPTIONS, PROPERTY_TYPES } from "@/features/landscape-site/content/site";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";

const formSchema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  title: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  propertyAddress: z.string().optional(),
  propertyType: z.enum(PROPERTY_TYPES),
  numberOfProperties: z.string().optional(),
  servicesNeeded: z.array(z.string()).optional(),
  currentProvider: z.string().optional(),
  bestTimeToReach: z.string().optional(),
  notes: z.string().optional(),
});

export default function CommercialQuote() {
  const [, setLocation] = useLocation();
  const page = useLandscapeCmsPage("commercial-quote", getPage("commercial-quote"));
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactName: "",
      title: "",
      companyName: "",
      email: "",
      phone: "",
      propertyAddress: "",
      propertyType: PROPERTY_TYPES[0],
      numberOfProperties: "1",
      servicesNeeded: [],
      currentProvider: "",
      bestTimeToReach: "",
      notes: "",
    },
  });

  const createQuote = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      await apiRequest("POST", "/api/forms/commercial-quote/submit", {
        ...values,
        sourcePage: "/commercial-quote",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setErrorMsg("");
    createQuote.mutate(values, {
      onSuccess: () => setSuccess(true),
      onError: (err) => setErrorMsg(err.message || "An error occurred submitting your quote."),
    });
  };

  if (!page) return null;

  return (
    <div className="w-full bg-background min-h-screen pb-24">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      <div className="bg-foreground py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-topo-light opacity-50 pointer-events-none"></div>
        <BotanicalAccent variant="fern" className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 h-56 w-auto text-primary/15" />
        <BotanicalAccent variant="fern" className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 h-56 w-auto text-primary/15 scale-x-[-1]" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{page.h1}</h1>
          <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
            {page.blocks.find(b => b.type === 'p')?.text || "Request a commercial proposal."}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10">
        <div className="bg-card bg-paper p-8 md:p-12 rounded-xl shadow-natural-lg border border-border relative z-10">
          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-3xl font-extrabold text-foreground mb-4">Request Received</h2>
              <p className="text-lg text-muted-foreground font-medium">
                Thank you! Our commercial team has received your request and will contact you shortly.
              </p>
              <Button className="mt-8" onClick={() => setLocation("/")}>RETURN HOME</Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Contact Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Title/Role</FormLabel>
                        <FormControl>
                          <Input placeholder="Property Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="font-bold">Company / HOA Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Properties" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Email Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="(704) 555-0123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="h-px bg-border w-full my-8" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="propertyAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="font-bold">Primary Property Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Monroe NC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Property Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROPERTY_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numberOfProperties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Number of Properties</FormLabel>
                        <FormControl>
                          <Input placeholder="1" type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Current Landscaping Provider</FormLabel>
                        <FormControl>
                          <Input placeholder="If any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bestTimeToReach"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Best Time to Reach You</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Weekday mornings" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="servicesNeeded"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base font-bold text-foreground">Services Needed (Select all that apply)</FormLabel>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {COMMERCIAL_SERVICE_OPTIONS.map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="servicesNeeded"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== item)
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-medium text-sm text-foreground cursor-pointer">
                                    {item}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Current challenges, scope of work..." className="min-h-32" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMsg && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm font-bold">
                    {errorMsg}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={createQuote.isPending}>
                  {createQuote.isPending ? "SUBMITTING..." : "REQUEST PROPOSAL"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
