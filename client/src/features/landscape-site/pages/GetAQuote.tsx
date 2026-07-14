import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getPage } from "@/features/landscape-site/content";
import { useLandscapeCmsPage } from "@/features/landscape-site/use-landscape-cms";
import { Seo } from "@/features/landscape-site/components/Seo";
import { QUOTE_SERVICE_OPTIONS } from "@/features/landscape-site/content/site";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { useLocation } from "wouter";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  audienceType: z.enum(["residential", "commercial"]),
  address: z.string().optional(),
  city: z.string().optional(),
  servicesInterested: z.array(z.string()).optional(),
  message: z.string().optional(),
});

export default function GetAQuote() {
  const [, setLocation] = useLocation();
  const page = useLandscapeCmsPage("get-a-quote", getPage("get-a-quote"));
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      audienceType: "residential",
      address: "",
      city: "",
      servicesInterested: [],
      message: "",
    },
  });

  const createQuote = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      await apiRequest("POST", "/api/forms/residential-quote/submit", {
        ...values,
        sourcePage: "/get-a-quote",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.audienceType === "commercial") {
      setLocation("/commercial-quote");
      return;
    }

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
            {page.blocks.find(b => b.type === 'p')?.text || "Request a free estimate."}
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
                Thank you! We have received your request and will be in touch shortly to schedule your consultation.
              </p>
              <Button className="mt-8" onClick={() => setLocation("/")}>RETURN HOME</Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <FormField
                  control={form.control}
                  name="audienceType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-bold text-foreground">Property Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(val) => {
                            field.onChange(val);
                            if (val === 'commercial') {
                              setLocation("/commercial-quote");
                            }
                          }}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="residential" />
                            </FormControl>
                            <FormLabel className="font-medium text-foreground cursor-pointer">Residential Home</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="commercial" />
                            </FormControl>
                            <FormLabel className="font-medium text-foreground cursor-pointer">Commercial / HOA</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">City</FormLabel>
                        <FormControl>
                          <Input placeholder="Waxhaw" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="servicesInterested"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base font-bold text-foreground">Services Needed (Select all that apply)</FormLabel>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {QUOTE_SERVICE_OPTIONS.map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="servicesInterested"
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
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Project Details / Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us a bit about your property and what you're looking for..." className="min-h-32" {...field} />
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
                  {createQuote.isPending ? "SUBMITTING..." : "REQUEST QUOTE"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
