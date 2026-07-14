import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createBlock, type BuilderContent } from "../builder/block-registry";
import { Wand2 } from "lucide-react";

interface LandingPageWizardProps {
  open: boolean;
  onClose: () => void;
  onCreate: (content: BuilderContent, title: string) => void;
}

function block(type: string, props: Record<string, unknown>) {
  const instance = createBlock(type);
  return {
    ...instance,
    props: {
      ...instance.props,
      ...props,
    },
  };
}

export function LandingPageWizard({ open, onClose, onCreate }: LandingPageWizardProps) {
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [ctaText, setCtaText] = useState("Get Started");
  const [ctaLink, setCtaLink] = useState("/");

  const reset = () => {
    setHeadline("");
    setSubheadline("");
    setCtaText("Get Started");
    setCtaLink("/");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    const title = headline.trim() || "Landing Page";
    onCreate(
      {
        blocks: [
          block("hero", {
            heading: title,
            subheading: subheadline || "Add concise supporting copy for this page.",
          }),
          block("cards-grid", {
            title: "Highlights",
            cards: [
              { title: "Highlight one", description: "Describe a key point." },
              { title: "Highlight two", description: "Describe a second key point." },
              { title: "Highlight three", description: "Describe a third key point." },
            ],
          }),
          block("cta", {
            heading: "Next step",
            subheading: "Invite visitors to continue.",
            primaryText: ctaText,
            primaryLink: ctaLink,
          }),
        ],
      },
      title,
    );
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-xl" data-testid="dialog-landing-wizard">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-violet-500" />
            Landing Page Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wiz-headline">Page Headline</Label>
            <Input
              id="wiz-headline"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="Page headline"
              data-testid="input-wizard-headline"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wiz-subheadline">Subheadline</Label>
            <Textarea
              id="wiz-subheadline"
              value={subheadline}
              onChange={(event) => setSubheadline(event.target.value)}
              placeholder="Supporting text that expands on the headline"
              rows={3}
              data-testid="input-wizard-subheadline"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="wiz-cta-text">CTA Button Text</Label>
              <Input id="wiz-cta-text" value={ctaText} onChange={(event) => setCtaText(event.target.value)} data-testid="input-wizard-cta-text" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wiz-cta-link">CTA Button Link</Label>
              <Input id="wiz-cta-link" value={ctaLink} onChange={(event) => setCtaLink(event.target.value)} autoPrependHttps data-testid="input-wizard-cta-link" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="button-wizard-cancel">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!headline.trim()} data-testid="button-wizard-create">
            Create Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
